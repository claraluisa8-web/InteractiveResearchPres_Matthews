import { RangeSetBuilder, StateField, type Extension, type EditorState } from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, WidgetType, gutter, type DecorationSet } from '@codemirror/view';

// Frame 07 decorations, recomputed from the live text on every change:
// section marker row, issue rows with a red bar and dot, authorship marks
// (dashed builder / solid you) and right-aligned row notes.

export interface LineInfo {
  issue?: boolean;
  /** Authorship mark in the gutter: rows inside the section. */
  author?: 'builder' | 'you';
  note?: string;
  noteKind?: 'issue' | 'you' | 'plain';
  /** Section marker row drawn above this line. */
  marker?: string;
  inSection?: boolean;
}

export type Annotate = (text: string) => Map<number, LineInfo>;

class MarkerWidget extends WidgetType {
  constructor(readonly text: string) { super(); }
  eq(other: MarkerWidget) { return other.text === this.text; }
  toDOM() {
    const el = document.createElement('div');
    el.className = 'cm-section-marker';
    el.textContent = this.text;
    return el;
  }
}

class DotMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement('span');
    el.className = 'cm-issue-dot';
    return el;
  }
}

class AuthorMarker extends GutterMarker {
  constructor(readonly who: 'builder' | 'you') { super(); }
  eq(other: AuthorMarker) { return other.who === this.who; }
  toDOM() {
    const el = document.createElement('span');
    el.className = `cm-author cm-author--${this.who}`;
    return el;
  }
}
const dot = new DotMarker();
const builderMark = new AuthorMarker('builder');
const youMark = new AuthorMarker('you');

export interface SectionExtensions {
  /** Line decorations and the marker row. */
  main: Extension;
  /** Issue dots, placed before the line numbers. */
  before: Extension;
  /** Authorship marks, placed after the line numbers. */
  after: Extension;
}

export function sectionExtensions(annotate: Annotate): SectionExtensions {
  const info = StateField.define<Map<number, LineInfo>>({
    create: (state) => annotate(state.doc.toString()),
    update: (value, tr) => (tr.docChanged ? annotate(tr.state.doc.toString()) : value),
  });

  const decorations = (state: EditorState): DecorationSet => {
    const map = state.field(info);
    const b = new RangeSetBuilder<Decoration>();
    for (let n = 1; n <= state.doc.lines; n++) {
      const li = map.get(n);
      if (!li) continue;
      const line = state.doc.line(n);
      if (li.marker) b.add(line.from, line.from, Decoration.widget({ widget: new MarkerWidget(li.marker), block: true, side: -1 }));
      const cls = [li.issue ? 'cm-issue-row' : '', li.inSection ? 'cm-in-section' : '', li.author === 'you' ? 'cm-your-row' : ''].filter(Boolean).join(' ');
      const attrs: Record<string, string> = {};
      if (li.note) { attrs['data-note'] = li.note; attrs['data-note-kind'] = li.noteKind ?? 'plain'; }
      if (cls || li.note) b.add(line.from, line.from, Decoration.line({ class: cls, attributes: attrs }));
    }
    return b.finish();
  };

  const at = (view: EditorView, from: number) => view.state.field(info).get(view.state.doc.lineAt(from).number);

  return {
    main: [info, EditorView.decorations.compute([info], decorations)],
    before: gutter({
      class: 'cm-issue-gutter',
      lineMarker: (view, block) => (at(view, block.from)?.issue ? dot : null),
      lineMarkerChange: (u) => u.docChanged || u.startState.field(info, false) !== u.state.field(info, false),
      initialSpacer: () => dot,
    }),
    after: gutter({
      class: 'cm-author-gutter',
      lineMarker: (view, block) => {
        const who = at(view, block.from)?.author;
        return who === 'you' ? youMark : who === 'builder' ? builderMark : null;
      },
      lineMarkerChange: (u) => u.docChanged || u.startState.field(info, false) !== u.state.field(info, false),
      initialSpacer: () => builderMark,
    }),
  };
}

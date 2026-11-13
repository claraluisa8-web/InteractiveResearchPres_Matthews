import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { java } from '@codemirror/lang-java';
import { yaml } from '@codemirror/lang-yaml';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { pmrHighlight, pmrTheme } from '../lib/cmTheme';

interface CodeEditorProps {
  file: string;
  doc: string;
  readOnly?: boolean;
  size?: { font: number; line: number };
  label: string;
  onChange?: (text: string) => void;
  onCursorLine?: (line: number) => void;
  /** Ctrl/Cmd+S inside the editor. */
  onSave?: () => void;
}

const languageFor = (file: string) => (file.endsWith('.java') ? [java()] : file.endsWith('.yaml') ? [yaml()] : []);

/** CodeMirror 6: real typing, selection, undo and paste. One instance per file; remount to switch files. */
export function CodeEditor({ file, doc, readOnly, size = { font: 12, line: 20 }, label, onChange, onCursorLine, onSave }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const cbs = useRef({ onChange, onCursorLine, onSave });
  cbs.current = { onChange, onCursorLine, onSave };

  useEffect(() => {
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          indentOnInput(),
          bracketMatching(),
          EditorState.tabSize.of(2),
          EditorState.readOnly.of(!!readOnly),
          EditorView.editable.of(!readOnly),
          EditorView.contentAttributes.of({ 'aria-label': label }),
          keymap.of([
            { key: 'Mod-s', preventDefault: true, run: () => (cbs.current.onSave?.(), true) },
            // Esc leaves the editor to the app's layer stack instead of being swallowed.
            { key: 'Escape', run: () => false },
            ...defaultKeymap,
            ...historyKeymap,
            indentWithTab,
          ]),
          ...languageFor(file),
          pmrTheme(size),
          pmrHighlight,
          EditorView.updateListener.of((u) => {
            if (u.docChanged) cbs.current.onChange?.(u.state.doc.toString());
            if (u.selectionSet || u.docChanged) cbs.current.onCursorLine?.(u.state.doc.lineAt(u.state.selection.main.head).number);
          }),
        ],
      }),
    });
    return () => view.destroy();
    // The editor owns its text after mount; `doc` only seeds it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return <div ref={host} className="code-editor" />;
}

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as tg } from '@lezer/highlight';

// Editor theme built from tokens.color.code. Values mirror shared/tokens.css (CodeMirror needs them in JS).
const code = {
  text: 'var(--pmr-code)',
  keyword: 'var(--pmr-code-keyword)',
  type: 'var(--pmr-code-type)',
  string: 'var(--pmr-code-string)',
  annotation: 'var(--pmr-code-annotation)',
  comment: 'var(--pmr-code-comment)',
  lineNumber: 'var(--pmr-code-line-number)',
};

export function pmrTheme(size: { font: number; line: number }) {
  return EditorView.theme(
    {
      '&': { color: code.text, backgroundColor: 'transparent', fontSize: `${size.font}px`, height: '100%' },
      '&.cm-focused': { outline: 'none' },
      '.cm-scroller': { fontFamily: 'var(--pmr-mono)', lineHeight: `${size.line}px`, overflow: 'auto' },
      '.cm-content': { caretColor: 'var(--pmr-lavender)', padding: '6px 0' },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--pmr-lavender)', borderLeftWidth: '2px' },
      '.cm-activeLine': { backgroundColor: 'var(--pmr-row-highlight)' },
      '.cm-activeLineGutter': { backgroundColor: 'var(--pmr-row-highlight)', color: 'var(--pmr-text)' },
      '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: code.lineNumber },
      // Line numbers sit 1px smaller than the code so they read as secondary.
      '.cm-lineNumbers .cm-gutterElement': { fontSize: `${size.font - 1}px`, padding: '0 14px 0 16px', minWidth: '44px' },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': { backgroundColor: 'rgba(138, 130, 253, 0.32) !important' },
      '.cm-matchingBracket': { backgroundColor: 'rgba(138, 130, 253, 0.22)', outline: 'none' },
    },
    { dark: true },
  );
}

export const pmrHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [tg.keyword, tg.modifier, tg.controlKeyword, tg.operatorKeyword, tg.definitionKeyword, tg.bool, tg.null], color: code.keyword },
    { tag: [tg.typeName, tg.className, tg.namespace], color: code.type },
    { tag: [tg.string, tg.special(tg.string), tg.number], color: code.string },
    { tag: [tg.annotation, tg.meta], color: code.annotation },
    { tag: [tg.comment, tg.lineComment, tg.blockComment], color: code.comment, fontStyle: 'italic' },
    { tag: [tg.propertyName, tg.attributeName], color: code.type },
  ]),
);

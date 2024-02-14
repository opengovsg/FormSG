// Styles for the Tiptap rich text editor
export const editorStyles = {
  // Apply styles only to editable instances
  '.tiptap[contentEditable=true]': {
    'min-height': '10em',
    padding: '1em',
  },
  '.tiptap ul, ol': {
    'margin-block-start': '1em',
    'margin-block-end': '1em',
    'padding-inline-start': '40px',
  },
  '.tiptap a': {
    color: 'blue',
    'text-decoration': 'underline',
  },
  '.tiptap a:visited': {
    color: 'purple',
  },
  '.tiptap h2, h3, h4': {
    fontSize: 'revert',
    fontWeight: 'bolder',
  },
  // For H1, we can't use fontSize: revert due to how H1 font-size is calculated in <aside> (where the Tiptap editor resides).
  // See: https://html.spec.whatwg.org/multipage/rendering.html#sections-and-headings
  '.tiptap h1': {
    fontSize: '2em', // HTML Standard
    fontWeight: 'bolder',
  },
  // Display placeholder for first line in an empty editor
  // See: https://tiptap.dev/docs/editor/api/extensions/placeholder#placeholder
  '.tiptap p.is-editor-empty:first-child::before': {
    color: '#adb5bd',
    content: 'attr(data-placeholder)',
    float: 'left',
    height: '0m',
    'pointer-events': 'none',
  },
}

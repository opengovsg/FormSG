// Styles for the Tiptap rich text editor
export const editorStyles = {
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
}

// Styles for the Tiptap rich text editor
export const editorStyles = {
  // Apply styles only to editable instances
  '.tiptap[contentEditable=true]': {
    minHeight: '10em',
    padding: '1em',
  },
  '.tiptap ul, ol': {
    all: 'revert',
  },
  '.tiptap ol ol': {
    listStyleType: 'lower-alpha',
  },
  '.tiptap ol ol ol': {
    listStyleType: 'lower-roman',
  },
  '.tiptap a': {
    color: 'blue',
    textDecoration: 'underline',
  },
  '.tiptap a:visited': {
    color: 'purple',
  },
  '.tiptap a:hover': {
    cursor: 'pointer',
  },
  // Display placeholder for first line in an empty editor
  // See: https://tiptap.dev/docs/editor/api/extensions/placeholder#placeholder
  '.tiptap p.is-editor-empty:first-child::before': {
    color: '#adb5bd',
    content: 'attr(data-placeholder)',
    float: 'left',
    height: '0m',
    pointerEvents: 'none',
  },
}

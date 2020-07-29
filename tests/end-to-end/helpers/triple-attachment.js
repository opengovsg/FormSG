// Form fields in a form with multiple attachments with the same filename.
// Meant to test de-duplication of attachment filenames. Note that the appending
// of the number to the file name is reversed: if attachment field 1 and attachment
// field 2 get the same filename 'fn.jpg', then attachment field 2 retains the old
// filename, while attachment field 1 gets renamed to '1-fn.jpg'.
const { makeField } = require('./util')
module.exports = {
  tripleAttachment: [
    {
      title: 'Attachment 1',
      fieldType: 'attachment',
      attachmentSize: '1',
      val: '2-test-att.txt',
      path: '../files/att-folder-1/test-att.txt',
      content: 'att-folder-1',
    },
    {
      title: 'Attachment 2',
      fieldType: 'attachment',
      attachmentSize: '1',
      val: '1-test-att.txt',
      path: '../files/att-folder-2/test-att.txt',
      content: 'att-folder-2',
    },
    {
      title: 'Attachment 3',
      fieldType: 'attachment',
      attachmentSize: '1',
      val: 'test-att.txt',
      path: '../files/att-folder-3/test-att.txt',
      content: 'att-folder-3',
    },
  ].map(makeField),
}

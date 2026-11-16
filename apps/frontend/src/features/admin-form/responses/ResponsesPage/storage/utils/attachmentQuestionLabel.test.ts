import { BasicField } from 'formsg-shared/types'

import { getAttachmentQuestionLabel } from './attachmentQuestionLabel'

describe('getAttachmentQuestionLabel', () => {
  it('should label an attachment question [attachment] by default', () => {
    expect(
      getAttachmentQuestionLabel({
        question: 'Passport',
        fieldType: BasicField.Attachment,
        keepV4AttachmentPrefix: false,
      }),
    ).toBe('[attachment] Passport')
  })

  it('should leave an attachment question unlabelled when keep-v4-attachment-prefix is on', () => {
    expect(
      getAttachmentQuestionLabel({
        question: 'Passport',
        fieldType: BasicField.Attachment,
        keepV4AttachmentPrefix: true,
      }),
    ).toBe('Passport')
  })

  it('should leave other questions unlabelled', () => {
    expect(
      getAttachmentQuestionLabel({
        question: 'Name',
        fieldType: BasicField.ShortText,
        keepV4AttachmentPrefix: false,
      }),
    ).toBe('Name')
  })
})

import { BasicField } from 'formsg-shared/types'

import { getAttachmentQuestionLabel } from './attachmentQuestionLabel'

describe('getAttachmentQuestionLabel', () => {
  it('should label an attachment question [attachment] by default', () => {
    expect(
      getAttachmentQuestionLabel({
        question: 'Passport',
        fieldType: BasicField.Attachment,
        keepV4ResponseFormat: false,
      }),
    ).toBe('[attachment] Passport')
  })

  it('should leave an attachment question unlabelled when keep-v4-response-format is on', () => {
    expect(
      getAttachmentQuestionLabel({
        question: 'Passport',
        fieldType: BasicField.Attachment,
        keepV4ResponseFormat: true,
      }),
    ).toBe('Passport')
  })

  it('should leave other questions unlabelled', () => {
    expect(
      getAttachmentQuestionLabel({
        question: 'Name',
        fieldType: BasicField.ShortText,
        keepV4ResponseFormat: false,
      }),
    ).toBe('Name')
  })
})

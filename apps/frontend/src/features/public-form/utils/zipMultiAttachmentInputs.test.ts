import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BasicField, FormFieldDto } from 'formsg-shared/types'

import { zipMultiAttachmentInputs } from './zipMultiAttachmentInputs'

// jsdom's File can't be read, so client-zip itself isn't run here
const { downloadZip } = vi.hoisted(() => ({ downloadZip: vi.fn() }))
vi.mock('client-zip', () => ({ downloadZip }))

const MULTI_ID = 'multi'
const SINGLE_ID = 'single'

const formFields = [
  { _id: MULTI_ID, fieldType: BasicField.Attachment, allowMultiple: true },
  { _id: SINGLE_ID, fieldType: BasicField.Attachment },
] as unknown as FormFieldDto[]

describe('zipMultiAttachmentInputs', () => {
  beforeEach(() => {
    downloadZip.mockReset()
    downloadZip.mockReturnValue({ blob: async () => new Blob(['zip']) })
  })

  it("zips a multi-file field's files into one file", async () => {
    const files = [new File(['a'], 'a.pdf'), new File(['b'], 'b.jpg')]
    const single = new File(['single'], 'single.pdf')

    const inputs: Record<string, unknown> = await zipMultiAttachmentInputs(
      formFields,
      { [MULTI_ID]: files, [SINGLE_ID]: single },
    )

    expect(downloadZip).toHaveBeenCalledExactlyOnceWith(files)
    expect(inputs[MULTI_ID]).toMatchObject({
      name: 'attachments.zip',
      type: 'application/zip',
    })
    expect(inputs[SINGLE_ID]).toBe(single)
  })

  it('leaves a multi-file field with no files unanswered', async () => {
    const inputs = await zipMultiAttachmentInputs(formFields, {
      [MULTI_ID]: [],
    })

    expect(inputs[MULTI_ID]).toBeUndefined()
    expect(downloadZip).not.toHaveBeenCalled()
  })

  it("keeps an earlier MRF step's zip as it is", async () => {
    const earlierZip = new File(['zip'], 'Question 1.zip')

    const inputs = await zipMultiAttachmentInputs(formFields, {
      [MULTI_ID]: earlierZip,
    })

    expect(inputs[MULTI_ID]).toBe(earlierZip)
    expect(downloadZip).not.toHaveBeenCalled()
  })
})

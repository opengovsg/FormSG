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

  it("sends an earlier MRF step's zip back unchanged, as a read-only step's answer must match it", async () => {
    const files = [new File(['a'], 'a.pdf'), new File(['b'], 'b.jpg')]
    const zip = new Uint8Array([1, 2, 3])

    const inputs: Record<string, unknown> = await zipMultiAttachmentInputs(
      formFields,
      { [MULTI_ID]: [...files] },
      { [MULTI_ID]: { zip, files } },
    )

    expect(downloadZip).not.toHaveBeenCalled()
    expect(inputs[MULTI_ID]).toMatchObject({
      name: 'attachments.zip',
      size: zip.length,
    })
  })

  it("zips again once an earlier MRF step's files change", async () => {
    const files = [new File(['a'], 'a.pdf')]
    const added = new File(['c'], 'c.txt')

    await zipMultiAttachmentInputs(
      formFields,
      { [MULTI_ID]: [...files, added] },
      { [MULTI_ID]: { zip: new Uint8Array([1]), files } },
    )

    expect(downloadZip).toHaveBeenCalledWith([...files, added])
  })
})

import { downloadZip } from 'client-zip'

import { BasicField, FormFieldDto } from 'formsg-shared/types'

/**
 * Zips each multi-file attachment's files into one file, so it is uploaded,
 * scanned and stored like a single attachment. The server reads the files
 * from the zip and names it.
 */
export const zipMultiAttachmentInputs = async <
  T extends Record<string, unknown>,
>(
  formFields: FormFieldDto[],
  formInputs: T,
): Promise<T> => {
  const zippedInputs: Record<string, unknown> = { ...formInputs }
  for (const field of formFields) {
    if (field.fieldType !== BasicField.Attachment || !field.allowMultiple) {
      continue
    }
    const files = formInputs[field._id]
    // An earlier MRF step's answer is already its zip
    if (!Array.isArray(files)) continue
    if (!files.length) {
      zippedInputs[field._id] = undefined
      continue
    }
    const zip = await downloadZip(files as File[]).blob()
    zippedInputs[field._id] = new File([zip], 'attachments.zip', {
      type: 'application/zip',
    })
  }
  return zippedInputs as T
}

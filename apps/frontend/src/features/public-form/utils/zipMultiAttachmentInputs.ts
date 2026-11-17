import { downloadZip } from 'client-zip'

import { BasicField, FormFieldDto } from 'formsg-shared/types'

export type PreviousMultiAttachments = Record<
  string,
  { zip: Uint8Array<ArrayBuffer>; files: File[] }
>

const toZipFile = (zip: Blob | Uint8Array<ArrayBuffer>) =>
  new File([zip], 'attachments.zip', { type: 'application/zip' })

const storedZipIfFilesUnchanged = (
  previous: PreviousMultiAttachments[string] | undefined,
  files: File[],
) =>
  previous?.files.length === files.length &&
  previous.files.every((file, i) => file === files[i])
    ? toZipFile(previous.zip)
    : undefined

export const zipMultiAttachmentInputs = async <
  T extends Record<string, unknown>,
>(
  formFields: FormFieldDto[],
  formInputs: T,
  previousMultiAttachments: PreviousMultiAttachments = {},
): Promise<T> => {
  const zippedInputs: Record<string, unknown> = { ...formInputs }
  for (const field of formFields) {
    if (field.fieldType !== BasicField.Attachment || !field.allowMultiple) {
      continue
    }
    const files = formInputs[field._id]
    if (!Array.isArray(files)) continue
    if (!files.length) {
      zippedInputs[field._id] = undefined
      continue
    }
    zippedInputs[field._id] =
      storedZipIfFilesUnchanged(
        previousMultiAttachments[field._id],
        files as File[],
      ) ?? toZipFile(await downloadZip(files as File[]).blob())
  }
  return zippedInputs as T
}

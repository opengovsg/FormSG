import { useCallback, useContext, useMemo } from 'react'
import { DropzoneProps, FileRejection } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { datadogLogs } from '@datadog/browser-logs'
import imageCompression from 'browser-image-compression'

import { MB } from 'formsg-shared/constants/file'
import { VALID_EXTENSIONS } from 'formsg-shared/utils/file-validation'

import { PublicFormContext } from '~features/public-form/PublicFormContext'

import {
  getFileExtension,
  getInvalidFileExtensionsInZip,
  getReadableFileSize,
} from './utils'

const IMAGE_UPLOAD_TYPES_TO_COMPRESS = ['image/jpeg', 'image/png']

export type PreparedFile =
  | { kind: 'ok'; file: File }
  | { kind: 'error'; errorMessage: string }

export const useAttachmentFileChecks = ({
  allowedFileTypes,
  maxSize,
}: Pick<DropzoneProps, 'maxSize'> & { allowedFileTypes?: string[] }) => {
  const { t } = useTranslation()
  const publicFormId = useContext(PublicFormContext)?.formId

  const readableMaxSize = useMemo(
    () => (maxSize ? getReadableFileSize(maxSize) : undefined),
    [maxSize],
  )

  const getRejectionErrorMessage = useCallback(
    ({ file, errors }: FileRejection): string => {
      const [firstError] = errors
      switch (firstError.code) {
        case 'file-invalid-type':
          return allowedFileTypes
            ? t(
                'features.publicForm.components.fields.attachment.error.fileTypeNotAllowed',
                {
                  fileExt: getFileExtension(file.name),
                  allowedFileTypes: allowedFileTypes.join(', '),
                },
              )
            : t(
                `features.publicForm.components.fields.attachment.error.fileInvalidType`,
                { fileExt: getFileExtension(file.name) },
              )
        case 'too-many-files':
          return t(
            `features.publicForm.components.fields.attachment.error.tooManyFiles`,
          )
        default:
          return firstError.message
      }
    },
    [allowedFileTypes, t],
  )

  const prepareFile = useCallback(
    async (file: File): Promise<PreparedFile> => {
      if (file.type === 'application/zip') {
        try {
          const invalidFilesInZip = await getInvalidFileExtensionsInZip(
            file,
            VALID_EXTENSIONS,
          )
          if (invalidFilesInZip.length !== 0) {
            return {
              kind: 'error',
              errorMessage: t(
                'features.publicForm.components.fields.attachment.error.zipFileInvalidType',
                { stringOfInvalidExtensions: invalidFilesInZip.join(', ') },
              ),
            }
          }
        } catch {
          return {
            kind: 'error',
            errorMessage: t(
              'features.publicForm.components.fields.attachment.error.zipParsing',
            ),
          }
        }
      }

      // Compress images that are too large.
      if (
        IMAGE_UPLOAD_TYPES_TO_COMPRESS.includes(file.type) &&
        maxSize &&
        file.size > maxSize
      ) {
        const blob = await imageCompression(file, {
          maxSizeMB: maxSize / MB,
          maxWidthOrHeight: 1440,
          initialQuality: 0.8,
          useWebWorker: false,
          preserveExif: true,
        })
        if (blob.size === 0) {
          datadogLogs.logger.warn('attachment empty after compression', {
            formId: publicFormId,
            fileName: file.name,
            originalSize: file.size,
            originalType: file.type,
            reason: 'imageCompressionEmpty',
          })
          return {
            kind: 'error',
            errorMessage: t(
              'features.publicForm.components.fields.attachment.error.imageProcessingError',
            ),
          }
        }
        return {
          kind: 'ok',
          file: new File([blob], file.name, { type: blob.type }),
        }
      }

      return { kind: 'ok', file }
    },
    [maxSize, publicFormId, t],
  )

  const fileValidator = useCallback<NonNullable<DropzoneProps['validator']>>(
    (file) => {
      if (file.size === 0) {
        return {
          code: 'file-empty',
          message: t(
            'features.publicForm.components.fields.attachment.error.fileEmpty',
          ),
        }
      }
      if (
        !IMAGE_UPLOAD_TYPES_TO_COMPRESS.includes(file.type) &&
        maxSize &&
        file.size > maxSize
      ) {
        return {
          code: 'file-too-large',
          message: t(
            'features.publicForm.components.fields.attachment.error.fileTooLarge',
            { readableMaxSize },
          ),
        }
      }
      return null
    },
    [maxSize, readableMaxSize, t],
  )

  return {
    readableMaxSize,
    getRejectionErrorMessage,
    prepareFile,
    fileValidator,
  }
}

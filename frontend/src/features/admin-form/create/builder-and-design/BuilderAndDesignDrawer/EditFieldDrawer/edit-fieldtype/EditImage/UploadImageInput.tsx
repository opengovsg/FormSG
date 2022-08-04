import { useEffect } from 'react'
import { ControllerRenderProps } from 'react-hook-form'
import { forwardRef } from '@chakra-ui/react'
import imageCompression from 'browser-image-compression'

import {
  MAX_UPLOAD_FILE_SIZE,
  MB,
  VALID_UPLOAD_FILE_TYPES,
} from '~shared/constants/file'

import Attachment from '~components/Field/Attachment'

import { EditImageInputs } from './EditImage'

export type UploadedImage = {
  file?: File
  srcUrl?: string
}

type UploadImageInputProps = Pick<
  ControllerRenderProps<EditImageInputs, 'attachment'>,
  'name' | 'onChange' | 'value'
> & {
  onError?: (errMsg: string) => void
}

export const UploadImageInput = forwardRef<UploadImageInputProps, 'div'>(
  ({ name, onChange, value, onError }, ref): JSX.Element => {
    useEffect(() => {
      return () => {
        if (!value?.srcUrl) return
        URL.revokeObjectURL(value.srcUrl)
      }
    }, [value?.srcUrl])

    const handleChange = (file?: File) => {
      if (!file) return onChange({ file, srcUrl: undefined })

      if (/\.gif$/i.test(file.name)) {
        // No compression for gifs since they cannot be properly compressed and
        // will just be compressed into a static image.
        return onChange({
          file,
          srcUrl: URL.createObjectURL(file),
        })
      }

      return imageCompression(file, {
        maxSizeMB: MAX_UPLOAD_FILE_SIZE / MB,
        alwaysKeepResolution: true,
        initialQuality: 0.8,
        useWebWorker: false,
      }).then((compressed) => {
        onChange({
          file: compressed,
          srcUrl: URL.createObjectURL(compressed),
        })
      })
    }

    return (
      <Attachment
        ref={ref}
        accept={VALID_UPLOAD_FILE_TYPES}
        name={name}
        maxSize={MAX_UPLOAD_FILE_SIZE}
        showFileSize
        value={value?.file}
        onChange={handleChange}
        onError={onError}
      />
    )
  },
)

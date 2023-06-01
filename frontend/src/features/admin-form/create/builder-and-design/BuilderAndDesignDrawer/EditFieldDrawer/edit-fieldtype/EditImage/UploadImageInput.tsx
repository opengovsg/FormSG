import { useEffect } from 'react'
import { ControllerRenderProps } from 'react-hook-form'
import { forwardRef } from '@chakra-ui/react'

import {
  MAX_UPLOAD_FILE_SIZE,
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
      return onChange({
        file,
        srcUrl: URL.createObjectURL(file),
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

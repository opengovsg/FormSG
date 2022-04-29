import { useEffect } from 'react'
import { ControllerRenderProps } from 'react-hook-form'
import { forwardRef } from '@chakra-ui/react'

import {
  MAX_UPLOAD_FILE_SIZE,
  VALID_UPLOAD_FILE_TYPES,
} from '~shared/constants/file'

import Attachment from '~components/Field/Attachment'

import { EditImageInputs } from './EditImage'

type UploadImageInputProps = Pick<
  ControllerRenderProps<EditImageInputs, 'attachment'>,
  'name' | 'onChange' | 'value'
>

export const UploadImageInput = forwardRef<UploadImageInputProps, 'div'>(
  ({ name, onChange, value }, ref): JSX.Element => {
    useEffect(() => {
      return () => {
        if (!value?.srcUrl) return
        URL.revokeObjectURL(value.srcUrl)
      }
    }, [value?.srcUrl])

    const handleChange = (file?: File) => {
      onChange({
        file: file,
        srcUrl: file ? URL.createObjectURL(file) : undefined,
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
      />
    )
  },
)

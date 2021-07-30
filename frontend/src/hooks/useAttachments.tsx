import { useEffect, useState } from 'react'
import {
  DropzoneOptions as ReactDropzoneOptions,
  DropzoneState as ReactDropzoneState,
  FileRejection,
  useDropzone,
} from 'react-dropzone'

// Omit props that remove accessibility as we aim to target
// both mobile and desktop
type DropzoneOptions = Omit<
  ReactDropzoneOptions,
  'noClick' | 'noKeyboard' | 'noDrag'
>

export type DropzoneState = ReactDropzoneState & {
  reset: () => void
  deleteFile: (file: File) => void
}

// This hook layers over the useDropzone hook.
export const useAttachments = ({
  maxFiles = 1,
  ...rest
}: DropzoneOptions): DropzoneState => {
  const {
    acceptedFiles: actualAcceptedFiles,
    fileRejections: actualFileRejections,
    ...dropzoneState
  } = useDropzone({
    maxFiles,
    ...rest,
  })

  const [acceptedFiles, setAcceptedFiles] =
    useState<File[]>(actualAcceptedFiles)

  const [fileRejections, setFileRejections] =
    useState<FileRejection[]>(actualFileRejections)

  const reset = () => {
    setAcceptedFiles([])
    setFileRejections([])
  }

  const deleteFile = (file: File) => {
    const newAcceptedFiles = acceptedFiles.filter((f) => f !== file)
    setAcceptedFiles(newAcceptedFiles)
  }

  // Listen on file/errors so that exposed state is consistent with internal state
  useEffect(() => {
    setAcceptedFiles(actualAcceptedFiles)
    setFileRejections(actualFileRejections)
  }, [actualAcceptedFiles, actualFileRejections])

  return {
    acceptedFiles,
    fileRejections,
    reset,
    deleteFile,
    ...dropzoneState,
  }
}

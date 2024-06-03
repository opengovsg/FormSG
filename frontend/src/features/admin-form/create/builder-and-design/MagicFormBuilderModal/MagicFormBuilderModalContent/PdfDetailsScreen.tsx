import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  Flex,
  FormControl,
  FormErrorIcon,
  FormErrorMessage,
  FormLabel,
  ModalBody,
  ModalHeader,
  Text,
} from '@chakra-ui/react'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import { TextItem } from 'pdfjs-dist/types/src/display/api'

import {
  PDF_UPLOAD_FILE_SIZE_LIMIT,
  VALID_UPLOAD_FILE_TYPES_PDF,
} from '~shared/constants'

import { BxsErrorCircle } from '~assets/icons'
import Button from '~components/Button'
import Attachment from '~components/Field/Attachment'

import { useMagicFormBuilderWizard } from '../MagicFormBuilderWizardContext'

export const MagicFormBuilderPdfDetailsScreen = (): JSX.Element => {
  const {
    handleDetailsSubmit,
    isLoading,
    isFetching,
    handleBack,
    formMethods,
  } = useMagicFormBuilderWizard()

  const {
    setError,
    control,
    setValue,
    formState: { errors },
  } = formMethods

  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker
  // pdfjs.GlobalWorkerOptions.isEvalSupported = false

  const [pdfFile, setPdfFile] = useState<File>()
  const [pdfFileText, setPdfFileText] = useState<string>('')

  const fileToArrayBuffer = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(reader.result)
      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileUpload = async (file: File) => {
    setPdfFile(file)
    if (file) {
      const arrayBuffer = (await fileToArrayBuffer(file)) as ArrayBuffer
      try {
        const text = await pdfToText(arrayBuffer)
        setPdfFileText(text)
        setValue('pdfFileText', text)
      } catch (e) {
        console.error(e)
      }
    } else {
      setPdfFileText('')
      setValue('pdfFileText', '')
    }
  }
  async function pdfToText(data: ArrayBuffer) {
    const loadingTask = pdfjs.getDocument({ data, isEvalSupported: false })
    const pdf = await loadingTask.promise

    let combinedText = ''

    // Define mapping function outside of the loop
    // const mapItemToString = (item: TextItem | TextMarkedContent) => item.str

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const text = content.items
        .map((item) => {
          const textItem = item as TextItem
          return textItem.str
        })
        .join(' ')
      combinedText += text + '\n\n' // Adding two new lines to separate pages.
    }
    return combinedText.trim()
  }

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW={'42.5rem'} p={0}>
          Upload a PDF
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW={'42.5rem'} p={0}>
          <FormControl isInvalid={!!errors.pdfFileText}>
            <FormLabel>
              Upload a PDF - The PDF should not be a scanned copy and should not
              contain any restricted or sensitive information.
            </FormLabel>
            <Controller
              rules={{
                validate: (pdfFileText) => {
                  if (pdfFileText) return true
                  return 'This PDF file cannot be processed. Please ensure that the PDF uploaded contains selectable text and is not a scanned copy.'
                },
              }}
              name="pdfFileText"
              control={control}
              render={() => (
                <Attachment
                  isRequired
                  maxSize={PDF_UPLOAD_FILE_SIZE_LIMIT}
                  accept={VALID_UPLOAD_FILE_TYPES_PDF}
                  showFileSize
                  title="Upload a PDF"
                  onChange={handleFileUpload}
                  name="pdfFile"
                  value={pdfFile}
                  onError={(message) => setError('pdfFileText', { message })}
                />
              )}
            />

            <FormErrorMessage alignItems="top">
              {!pdfFileText && (
                <>
                  <FormErrorIcon h="1.5rem" as={BxsErrorCircle} />
                  {pdfFile
                    ? errors.pdfFileText?.message
                    : 'Please upload a PDF.'}
                </>
              )}
            </FormErrorMessage>
          </FormControl>

          <Flex justify="flex-end" gap="1rem" mt="2.5rem">
            <Button
              mr="0.5rem"
              type="submit"
              isDisabled={isLoading || isFetching}
              onClick={handleBack}
              variant="clear"
            >
              <Text lineHeight="1.5rem" color="secondary.500">
                Back
              </Text>
            </Button>
            <Button
              rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              type="submit"
              isLoading={isLoading}
              isDisabled={isFetching || isLoading}
              onClick={handleDetailsSubmit}
            >
              <Text lineHeight="1.5rem">Create form</Text>
            </Button>
          </Flex>
        </Container>
      </ModalBody>
    </>
  )
}

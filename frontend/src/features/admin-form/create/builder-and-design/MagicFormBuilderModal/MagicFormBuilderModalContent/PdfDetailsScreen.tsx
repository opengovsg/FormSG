import { useState } from 'react'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  Flex,
  FormLabel,
  ModalBody,
  ModalHeader,
  Text,
} from '@chakra-ui/react'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'

import { MB } from '~shared/constants'

import Badge from '~components/Badge'
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

  const { setValue } = formMethods

  const MAX_FILE_SIZE = 20 * MB
  const VALID_EXTENSIONS = '.pdf'
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

  const [pdfFile, setPdfFile] = useState<File | undefined>(undefined)
  const [pdfFileText, setPdfFileText] = useState<string>('')

  function fileToArrayBuffer(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(reader.result)
      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileUpload = async (file: any) => {
    setPdfFile(file)
    if (file) {
      const arrayBuffer = await fileToArrayBuffer(file)
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
  async function pdfToText(data: any) {
    const loadingTask = pdfjs.getDocument(data)
    const pdf = await loadingTask.promise

    let combinedText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const text = content.items.map((item: any) => item.str).join(' ')
      combinedText += text + '\n\n' // Adding two new lines to separate pages.
    }
    return combinedText.trim()
  }

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW={'42.5rem'} p={0}>
          Build your form using PDF
          <Badge bgColor="primary.100" ml="1rem">
            Beta
          </Badge>
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW={'42.5rem'} p={0}>
          <FormLabel>
            Upload a PDF - The PDF should not contain any restricted or
            sensitive information.
          </FormLabel>
          <Attachment
            maxSize={MAX_FILE_SIZE}
            accept={VALID_EXTENSIONS}
            showFileSize
            title={'Upload a PDF'}
            onChange={handleFileUpload}
            name="pdfFile"
            value={pdfFile}
          />

          <Flex justify="flex-end" gap="1rem" mt="2.5rem">
            <Button
              mr="1rem"
              type="submit"
              isDisabled={isLoading || isFetching}
              onClick={handleBack}
              variant="clear"
            >
              <Text lineHeight="1.5rem">Back</Text>
            </Button>
            <Button
              rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              type="submit"
              isLoading={isLoading}
              isDisabled={isFetching || isLoading || !pdfFileText}
              onClick={handleDetailsSubmit}
            >
              <Text lineHeight="1.5rem">Next step</Text>
            </Button>
          </Flex>
        </Container>
      </ModalBody>
    </>
  )
}

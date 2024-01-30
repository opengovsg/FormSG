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

import { MB } from '~shared/constants'

import Badge from '~components/Badge'
import Button from '~components/Button'
import Attachment from '~components/Field/Attachment'

import { useMagicFormBuilderWizard } from '../MagicFormBuilderWizardContext'

export const MagicFormBuilderPdfDetailsScreen = (): JSX.Element => {
  const { handleDetailsSubmit, isLoading, isFetching, handleBack } =
    useMagicFormBuilderWizard()

  const MAX_FILE_SIZE = 20 * MB
  const VALID_EXTENSIONS = '.pdf'

  const [pdfFile, setPdfFile] = useState<File | undefined>(undefined)

  function fileToArrayBuffer(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(reader.result)
      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  let pdfjs: any
  ;(async function () {
    pdfjs = await import('pdfjs-dist/build/pdf.js')
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry.js')
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker
  })()

  const handleFileUpload = async (file: any) => {
    setPdfFile(file)
    console.log('Uploaded file:', file)
    if (file) {
      const arrayBuffer = await fileToArrayBuffer(file)
      console.log('ArrayBuffer:', arrayBuffer)
      try {
        const text = await pdfToText(arrayBuffer)
        console.log(text)
      } catch (e) {
        console.log(e)
      }
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
    console.log(combinedText.trim())
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
          <FormLabel>Upload a PDF</FormLabel>
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
              isDisabled={isFetching}
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

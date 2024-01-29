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
            onChange={(file) => setPdfFile(file)}
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

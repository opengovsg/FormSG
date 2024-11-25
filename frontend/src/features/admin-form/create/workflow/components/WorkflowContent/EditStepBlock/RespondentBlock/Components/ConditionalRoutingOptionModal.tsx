import { useState } from 'react'
import { Controller, FieldErrors, UseFormReturn } from 'react-hook-form'
import { BiDownload } from 'react-icons/bi'
import {
  Box,
  Button,
  FormControl,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react'

import { MAX_UPLOAD_FILE_SIZE } from '~shared/constants'

import { useIsMobile } from '~hooks/useIsMobile'
import { NextAndBackButtonGroup } from '~components/Button'
import Attachment from '~components/Field/Attachment'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import { ModalCloseButton } from '~components/Modal'
import { ProgressIndicator } from '~components/ProgressIndicator/ProgressIndicator'

import CSV_TEMPLATE_EXAMPLE_IMAGE from './conditional-routing-example.png'
import { ConditionalRoutingConfig } from './ConditionalRoutingOption'
import { FieldItem } from './types'

const NUM_STEPS = 2

interface StepOneModalContentProps {
  stepNumber: number
  setStepNumber: (step: number) => void
  isMobile: boolean
  onDownloadCsvClick: ConditionalRoutingOptionModalProps['onDownloadCsvClick']
  isCsvTemplateDownloaded: boolean
  onClose: ConditionalRoutingOptionModalProps['onClose']
}

const StepOneModalContent = ({
  stepNumber,
  setStepNumber,
  isMobile,
  onDownloadCsvClick,
  isCsvTemplateDownloaded,
  onClose,
}: StepOneModalContentProps) => {
  return (
    <ModalContent minW="fit-content">
      <ModalCloseButton />
      <ModalHeader>
        <Text mb="0.25rem">Add emails to options</Text>
        <ProgressIndicator
          numIndicators={NUM_STEPS}
          currActiveIdx={stepNumber}
          onClick={(selectedStepNumber) => {
            if (selectedStepNumber > stepNumber && !isCsvTemplateDownloaded) {
              return
            }
            setStepNumber(selectedStepNumber)
          }}
        />
      </ModalHeader>
      <ModalBody>
        <Stack
          justifyContent="center"
          spacing="3rem"
          direction={isMobile ? 'column' : 'row'}
        >
          <Box w={isMobile ? '100%' : '25rem'}>
            <Stack spacing="0.5rem" mb="2.5rem">
              <Text textStyle="body-2">
                We have created a CSV template with the options from the field
                you selected.{' '}
                <Text as="span" fontWeight="semibold">
                  Please download the CSV template and add the emails for each
                  option.
                </Text>
              </Text>
              <Button
                w="100%"
                leftIcon={<BiDownload fontSize="1.5rem" />}
                onClick={onDownloadCsvClick}
              >
                Download and edit CSV template
              </Button>
            </Stack>
            <Stack spacing="1.5rem">
              <Text textStyle="h4" color="secondary.500">
                How to use the CSV template:
              </Text>
              <Box>
                <Text textStyle="subhead-1" color="secondary.500">
                  Column A
                </Text>
                <Text textStyle="body-2">
                  This contains all the options from your field.{' '}
                  <Text as="span" fontWeight="semibold">
                    Do not edit, reorder or delete anything in this column.
                  </Text>
                </Text>
              </Box>
              <Box>
                <Text textStyle="subhead-1" color="secondary.500">
                  Column B
                </Text>
                <Text textStyle="body-2">
                  Add the emails to send the form to for each option.{' '}
                  <Text as="span" fontWeight="semibold">
                    Separate multiple email(s) with a comma.
                  </Text>
                </Text>
              </Box>
            </Stack>
          </Box>
          <Stack spacing="1rem" alignItems="center">
            <Image w="466px" src={CSV_TEMPLATE_EXAMPLE_IMAGE} />
            <Text color="secondary.400" textStyle="caption-2">
              Your CSV template should look like this
            </Text>
          </Stack>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <NextAndBackButtonGroup
          nextButtonLabel="Next: Upload CSV file"
          handleBack={onClose}
          handleNext={() => setStepNumber(1)}
          isNextDisabled={!isCsvTemplateDownloaded}
        />
      </ModalFooter>
    </ModalContent>
  )
}

interface StepTwoModalContentProps {
  stepNumber: number
  setStepNumber: (step: number) => void
  control: ConditionalRoutingOptionModalProps['control']
  errors: ConditionalRoutingOptionModalProps['errors']
  onSubmit: ConditionalRoutingOptionModalProps['onSubmit']
  isSubmitDisabled: ConditionalRoutingOptionModalProps['isSubmitDisabled']
  validateCsvFile: ConditionalRoutingOptionModalProps['validateCsvFile']
}

const StepTwoModalContent = ({
  stepNumber,
  setStepNumber,
  control,
  errors,
  onSubmit,
  isSubmitDisabled,
  validateCsvFile,
}: StepTwoModalContentProps) => (
  <ModalContent>
    <ModalCloseButton />
    <ModalHeader>
      <Text mb="0.25rem">Upload your completed CSV file</Text>
      <ProgressIndicator
        numIndicators={NUM_STEPS}
        currActiveIdx={stepNumber}
        onClick={setStepNumber}
      />
    </ModalHeader>
    <ModalBody>
      <Text mb="2.5rem">
        Please ensure that your file is saved in{' '}
        <Text as="span" fontWeight="semibold">
          comma-separated values (.csv)
        </Text>{' '}
        format.
      </Text>
      <FormControl isInvalid={!!errors.csvFile}>
        <Controller
          name="csvFile"
          control={control}
          rules={{
            required: 'Please upload a CSV file',
            validate: validateCsvFile,
          }}
          render={({ field: { onChange, name, value } }) => (
            <Attachment
              onChange={onChange}
              value={value}
              name={name}
              isRequired
              showFileSize
              showDownload
              showRemove
              maxSize={MAX_UPLOAD_FILE_SIZE}
              accept={['.csv']}
            />
          )}
        />
        <FormErrorMessage>{errors.csvFile?.message}</FormErrorMessage>
      </FormControl>
    </ModalBody>
    <ModalFooter>
      <NextAndBackButtonGroup
        nextButtonLabel="Save CSV file"
        handleBack={() => setStepNumber(0)}
        handleNext={onSubmit}
        isNextDisabled={isSubmitDisabled}
      />
    </ModalFooter>
  </ModalContent>
)

export interface ConditionalRoutingOptionModalProps {
  isOpen: boolean
  onClose: () => void
  conditionalFieldItems: FieldItem[]
  isLoading: boolean
  control: UseFormReturn<ConditionalRoutingConfig>['control']
  errors: FieldErrors<ConditionalRoutingConfig>
  onDownloadCsvClick: () => void
  onSubmit: () => void
  isSubmitDisabled: boolean
  validateCsvFile: (value: File | null) => Promise<string | undefined>
}

export const ConditionalRoutingOptionModal = ({
  isOpen,
  onClose,
  control,
  errors,
  onDownloadCsvClick,
  onSubmit,
  isSubmitDisabled,
  validateCsvFile,
}: ConditionalRoutingOptionModalProps): JSX.Element => {
  const isMobile = useIsMobile()

  const [stepNumber, setStepNumber] = useState<number>(0)
  const [isCsvTemplateDownloaded, setIsCsvTemplateDownloaded] = useState(false)

  const onModalClose = () => {
    setStepNumber(0)
    onClose()
  }

  return (
    <Modal
      size={isMobile ? 'mobile' : undefined}
      isOpen={isOpen}
      onClose={onModalClose}
    >
      <ModalOverlay />
      {stepNumber === 0 && (
        <StepOneModalContent
          isMobile={isMobile}
          stepNumber={stepNumber}
          setStepNumber={setStepNumber}
          onDownloadCsvClick={() => {
            onDownloadCsvClick()
            setIsCsvTemplateDownloaded(true)
          }}
          isCsvTemplateDownloaded={isCsvTemplateDownloaded}
          onClose={onModalClose}
        />
      )}
      {stepNumber === 1 && (
        <StepTwoModalContent
          control={control}
          errors={errors}
          stepNumber={stepNumber}
          setStepNumber={setStepNumber}
          onSubmit={onSubmit}
          isSubmitDisabled={isSubmitDisabled}
          validateCsvFile={validateCsvFile}
        />
      )}
    </Modal>
  )
}

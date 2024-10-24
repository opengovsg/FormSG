import { useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
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
import { SingleSelect } from '~components/Dropdown'
import Attachment from '~components/Field/Attachment'
import { ModalCloseButton } from '~components/Modal'
import { ProgressIndicator } from '~components/ProgressIndicator/ProgressIndicator'

import { ConditionalRoutingConfig, FieldItem } from './RespondentBlock'

const NUM_STEPS = 3

interface StepOneModalContentProps {
  stepNumber: number
  setStepNumber: (step: number) => void
  control: UseFormReturn<ConditionalRoutingConfig>['control']
  conditionalFieldItems: FieldItem[]
  isLoading: boolean
  onClose: () => void
}

const StepOneModalContent = ({
  stepNumber,
  setStepNumber,
  control,
  conditionalFieldItems,
  isLoading,
  onClose,
}: StepOneModalContentProps) => {
  return (
    <ModalContent>
      <ModalCloseButton />
      <ModalHeader color="secondary.700">
        <Text mb="0.25rem">Step 1: Select a field from your form</Text>
        <ProgressIndicator
          numIndicators={NUM_STEPS}
          currActiveIdx={stepNumber}
          onClick={setStepNumber}
        />
      </ModalHeader>
      <ModalBody>
        <Stack spacing="0.75rem">
          <Text textStyle="subhead-1" color="secondary.700">
            Route the form based on the options in this field:
          </Text>
          <FormControl
            pt="0.5rem"
            isReadOnly={isLoading}
            id="field"
            isRequired
            // isInvalid={!!errors.field}
          >
            <Controller
              control={control}
              name={'conditionalFieldId'}
              rules={{
                required: 'Please select a field',
                validate: (selectedValue) => {
                  return (
                    isLoading ||
                    !conditionalFieldItems ||
                    conditionalFieldItems.some(
                      ({ value: fieldValue }) => fieldValue === selectedValue,
                    ) ||
                    'Field is not a dropdown or radio field'
                  )
                },
              }}
              render={({ field: { value = '', ...rest } }) => (
                <SingleSelect
                  zIndex={1400}
                  isDisabled={isLoading}
                  isClearable={false}
                  placeholder="Select a dropdown or radio field from your form"
                  items={conditionalFieldItems}
                  value={value}
                  {...rest}
                />
              )}
            />
          </FormControl>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <NextAndBackButtonGroup
          nextButtonLabel="Next: Add emails to options"
          backButtonLabel="Back to workflow"
          handleBack={onClose}
          handleNext={() => {
            setStepNumber(1)
          }}
          isNextDisabled={isLoading}
        />
      </ModalFooter>
    </ModalContent>
  )
}

interface StepTwoModalContentProps {
  stepNumber: number
  setStepNumber: (step: number) => void
  isMobile: boolean
  onDownloadCsvClick: () => void
}

const StepTwoModalContent = ({
  stepNumber,
  setStepNumber,
  isMobile,
  onDownloadCsvClick,
}: StepTwoModalContentProps) => (
  <ModalContent minW="fit-content">
    <ModalCloseButton />
    <ModalHeader>
      <Text mb="0.25rem">Step 2: Add emails to options</Text>
      <ProgressIndicator
        numIndicators={NUM_STEPS}
        currActiveIdx={stepNumber}
        onClick={setStepNumber}
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
              We have created a CSV template with the options from the field you
              selected.{' '}
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
              Download and edit CSV
            </Button>
          </Stack>
          <Stack spacing="1rem">
            <Text textStyle="subhead-1">How to use the CSV template:</Text>
            <Box>
              <Text textStyle="subhead-1">Column A</Text>
              <Text textStyle="body-2">
                This contains all the options from your field.{' '}
                <Text as="span" fontWeight="semibold">
                  Do not edit, reorder or delete anything in this column.
                </Text>
              </Text>
            </Box>
            <Box>
              <Text textStyle="subhead-1">Column B</Text>
              <Text textStyle="body-2">
                Add the email(s) to send the form to for each option.{' '}
                <Text as="span" fontWeight="semibold">
                  Separate multiple email(s) with a comma.
                </Text>
              </Text>
            </Box>
          </Stack>
        </Box>
        <Stack spacing="1rem" alignItems="center">
          <Image
            w="466px"
            src={'public/static/images/conditional-routing-example.png'}
          />
          <Text textStyle="caption-2">
            Your CSV template should look like this
          </Text>
        </Stack>
      </Stack>
    </ModalBody>
    <ModalFooter>
      <NextAndBackButtonGroup
        nextButtonLabel="Next: Upload CSV template"
        backButtonLabel="Back to previous step"
        handleBack={() => setStepNumber(0)}
        handleNext={() => setStepNumber(2)}
        isNextDisabled={false}
      />
    </ModalFooter>
  </ModalContent>
)

interface StepThreeModalContentProps {
  stepNumber: number
  setStepNumber: (step: number) => void
  control: UseFormReturn<ConditionalRoutingConfig>['control']
}

const StepThreeModalContent = ({
  stepNumber,
  setStepNumber,
  control,
}: StepThreeModalContentProps) => (
  <ModalContent>
    <ModalCloseButton />
    <ModalHeader>
      <Text mb="0.25rem">Step 3: Upload your completed CSV template</Text>
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
      <Controller
        name="csvFile"
        control={control}
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
          />
        )}
      />
    </ModalBody>
    <ModalFooter>
      <NextAndBackButtonGroup
        nextButtonLabel="Save CSV template"
        backButtonLabel="Back to previous step"
        handleBack={() => setStepNumber(1)}
        handleNext={() => {
          console.log('Parsing csv')
        }}
        isNextDisabled={true}
      />
    </ModalFooter>
  </ModalContent>
)

interface ConditionalRoutingOptionModalProps {
  isOpen: boolean
  onClose: () => void
  conditionalFieldItems: FieldItem[]
  isLoading: boolean
  control: UseFormReturn<ConditionalRoutingConfig>['control']
  onDownloadCsvClick: () => void
}

export const ConditionalRoutingOptionModal = ({
  isOpen,
  onClose,
  conditionalFieldItems,
  isLoading,
  control,
  onDownloadCsvClick,
}: ConditionalRoutingOptionModalProps): JSX.Element => {
  const isMobile = useIsMobile()

  const [stepNumber, setStepNumber] = useState<number>(0)

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
          stepNumber={stepNumber}
          setStepNumber={setStepNumber}
          control={control}
          conditionalFieldItems={conditionalFieldItems}
          isLoading={isLoading}
          onClose={onModalClose}
        />
      )}
      {stepNumber === 1 && (
        <StepTwoModalContent
          isMobile={isMobile}
          stepNumber={stepNumber}
          setStepNumber={setStepNumber}
          onDownloadCsvClick={onDownloadCsvClick}
        />
      )}
      {stepNumber === 2 && (
        <StepThreeModalContent
          control={control}
          stepNumber={stepNumber}
          setStepNumber={setStepNumber}
        />
      )}
    </Modal>
  )
}

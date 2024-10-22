import { useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { NextAndBackButtonGroup } from '~components/Button'
import { SingleSelect } from '~components/Dropdown'
import { ModalCloseButton } from '~components/Modal'
import { ProgressIndicator } from '~components/ProgressIndicator/ProgressIndicator'

import { EditStepInputs } from '../../../types'

import { FieldItem } from './RespondentBlock'

const NUM_STEPS = 3

interface ConditionalRoutingOptionModalProps {
  isOpen: boolean
  onClose: () => void
  conditionalFieldItems: FieldItem[]
  formMethods: UseFormReturn<EditStepInputs>
  isLoading: boolean
}

interface StepOneModalContentProps {
  stepNumber: number
  setStepNumber: (step: number) => void
  control: UseFormReturn<EditStepInputs>['control']
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
}: StepOneModalContentProps) => (
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
        <Controller
          control={control}
          name={'conditional_field'}
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
            <>
              <SingleSelect
                isDisabled={isLoading}
                isClearable={false}
                placeholder="Select a dropdown or radio field from your form"
                items={conditionalFieldItems}
                value={value}
                {...rest}
              />
            </>
          )}
        />
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

const StepTwoModalContent = ({ stepNumber, setStepNumber }) => (
  <ModalContent>
    <ModalCloseButton />
    <ModalHeader>
      <Text mb="0.25rem">Step 2: Add emails to options</Text>
      <ProgressIndicator
        numIndicators={NUM_STEPS}
        currActiveIdx={stepNumber}
        onClick={setStepNumber}
      />
    </ModalHeader>
    <ModalBody></ModalBody>
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

const StepThreeModalContent = ({ stepNumber, setStepNumber }) => (
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
    <ModalBody></ModalBody>
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

export const ConditionalRoutingOptionModal = ({
  isOpen,
  onClose,
  conditionalFieldItems,
  formMethods,
  isLoading,
}: ConditionalRoutingOptionModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const { control } = formMethods
  const [stepNumber, setStepNumber] = useState<number>(0)

  const onModalClose = () => {
    setStepNumber(0)
    onClose()
  }

  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onModalClose}>
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
          stepNumber={stepNumber}
          setStepNumber={setStepNumber}
        />
      )}
      {stepNumber === 2 && (
        <StepThreeModalContent
          stepNumber={stepNumber}
          setStepNumber={setStepNumber}
        />
      )}
    </Modal>
  )
}

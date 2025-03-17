import { useState } from 'react'
import { Controller, FieldErrors, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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

import CSV_TEMPLATE_EXAMPLE_GIF from './conditional-routing-example.gif'
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
  const { t } = useTranslation()
  return (
    <ModalContent minW="fit-content">
      <ModalCloseButton />
      <ModalHeader>
        <Text mb="0.25rem">
          {t(
            'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.title',
          )}
        </Text>
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
                {t(
                  'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.download.templateCreated',
                )}{' '}
                <Text as="span" fontWeight="semibold">
                  {t(
                    'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.download.pleaseDownload',
                  )}
                </Text>
              </Text>
              <Button
                w="100%"
                leftIcon={<BiDownload fontSize="1.5rem" />}
                onClick={onDownloadCsvClick}
              >
                {t(
                  'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.download.button',
                )}
              </Button>
            </Stack>
            <Stack spacing="1.5rem">
              <Text textStyle="h4" color="secondary.500">
                {t(
                  'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.download.howto.title',
                )}
              </Text>
              <Box>
                <Text textStyle="subhead-1" color="secondary.500">
                  {t(
                    'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.download.howto.option.title',
                  )}
                </Text>
                <Text textStyle="body-2">
                  {t(
                    'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.download.howto.option.explanation',
                  )}{' '}
                  <Text as="span" fontWeight="semibold">
                    {t(
                      'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.download.howto.option.notice',
                    )}
                  </Text>
                </Text>
              </Box>
              <Box>
                <Text textStyle="subhead-1" color="secondary.500">
                  {t(
                    'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.download.howto.email.title',
                  )}
                </Text>
                <Text textStyle="body-2">
                  {t(
                    'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.download.howto.email.explanation',
                  )}{' '}
                  <Text as="span" fontWeight="semibold">
                    {t(
                      'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.download.howto.email.notice',
                    )}
                  </Text>
                </Text>
              </Box>
            </Stack>
          </Box>
          <Stack spacing="1rem" alignItems="center">
            <Image w="466px" src={CSV_TEMPLATE_EXAMPLE_GIF} />
            <Text color="secondary.400" textStyle="caption-2">
              {t(
                'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.download.howto.imageCaption',
              )}
            </Text>
          </Stack>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <NextAndBackButtonGroup
          nextButtonLabel={t(
            'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step1.nextButton',
          )}
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
}: StepTwoModalContentProps) => {
  const { t } = useTranslation()
  return (
    <ModalContent>
      <ModalCloseButton />
      <ModalHeader>
        <Text mb="0.25rem">
          {t(
            'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step2.title',
          )}
        </Text>
        <ProgressIndicator
          numIndicators={NUM_STEPS}
          currActiveIdx={stepNumber}
          onClick={setStepNumber}
        />
      </ModalHeader>
      <ModalBody>
        <Text mb="2.5rem">
          {t(
            'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step2.description.prefix',
          )}{' '}
          <Text as="span" fontWeight="semibold">
            {t(
              'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step2.description.csv',
            )}
          </Text>{' '}
          {t(
            'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step2.description.suffix',
          )}
        </Text>
        <FormControl isInvalid={!!errors.csvFile}>
          <Controller
            name="csvFile"
            control={control}
            rules={{
              required: t(
                'features.adminForm.sidebar.workflow.conditionalRouting.errors.csv.required',
              ),
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
          nextButtonLabel={t(
            'features.adminForm.sidebar.workflow.conditionalRouting.modals.addMapping.step2.confirm',
          )}
          handleBack={() => setStepNumber(0)}
          handleNext={onSubmit}
          isNextDisabled={isSubmitDisabled}
        />
      </ModalFooter>
    </ModalContent>
  )
}

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

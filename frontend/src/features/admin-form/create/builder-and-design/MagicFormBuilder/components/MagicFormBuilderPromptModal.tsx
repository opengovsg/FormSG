import { useState } from 'react'
import {
  Control,
  Controller,
  FieldErrors,
  useForm,
  UseFormClearErrors,
  UseFormRegister,
  UseFormSetError,
  UseFormSetValue,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiSolidMagicWand } from 'react-icons/bi'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags, MFB_VISION_MAX_IMAGES_COUNT } from '~shared/constants'

import { NextAndBackButtonGroup } from '~components/Button'
import Attachment from '~components/Field/Attachment'

import { pdfBinaryToImageDataUrls } from '../utils'

const TEXT_PROMPT_IDEAS = [
  {
    label: 'Employee satisfaction',
    prompt:
      'employee feedback on workplace satisfaction, including fields on overall job satisfaction, suggestions for improvement and comments on company culture.',
  },
  {
    label: 'Event registration',
    prompt:
      'registrations for an event, including sections for personal details, event details and acknowledgement to terms and conditions.',
  },
  {
    label: 'Grant applications',
    prompt:
      'applications for government grants from business entities, incorporating sections for project details, budget breakdown and applicant qualifications.',
  },
  {
    label: 'Feedback collection',
    prompt:
      'feedback including rating scales for service quality satisfaction, justification for rating, specific feedback on what is good and what is bad and potential suggestions for improvement.',
  },
]

const PromptSelectorBar = ({
  promptIdeas,
  onClick,
}: {
  promptIdeas: {
    label: string
    prompt: string
  }[]
  onClick: (prompt: string) => void
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.magicFormBuilder.promptModal.textTab',
  })

  return (
    <Flex direction="column">
      <Text textStyle="subhead-1">{t('inspirationLabel')}</Text>
      <HStack
        display="flex"
        justifyContent="space-between"
        overflowX="auto"
        gap="0.25rem"
        mt="0.75rem"
      >
        {promptIdeas.map((idea) => (
          <Button
            key={idea.label}
            variant="clear"
            size="xs"
            borderRadius="4px"
            backgroundColor="primary.100"
            _focus={{
              backgroundColor: 'primary.200',
              textColor: 'primary.600',
            }}
            _hover={{
              backgroundColor: 'primary.200',
            }}
            onClick={() => {
              onClick(idea.prompt)
            }}
          >
            {idea.label}
          </Button>
        ))}
      </HStack>
    </Flex>
  )
}

export interface TextPromptInputs {
  prompt: string
}

const TextPromptModalBodyContent = ({
  register,
  setValue,
  errors,
}: {
  register: UseFormRegister<TextPromptInputs>
  setValue: UseFormSetValue<TextPromptInputs>
  errors: FieldErrors<TextPromptInputs>
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.magicFormBuilder.promptModal.textTab',
  })

  return (
    <>
      <FormControl isInvalid={!!errors.prompt?.message}>
        <FormLabel textStyle="subhead-1">{t('promptLabel')}</FormLabel>
        <Textarea
          minH="9rem"
          borderRadius="4px"
          placeholder={t('promptPlaceholder')}
          {...register('prompt', {
            required: t('validation.required'),
            maxLength: {
              value: 500,
              message: t('validation.maxLength'),
            },
          })}
        />
        <FormErrorMessage>{errors.prompt?.message}</FormErrorMessage>
      </FormControl>
      <Box mt="1rem">
        <PromptSelectorBar
          promptIdeas={TEXT_PROMPT_IDEAS}
          onClick={(prompt) => setValue('prompt', prompt)}
        />
      </Box>
    </>
  )
}

export interface VisionPromptInputs {
  attachment: File
}

const VisionPromptModalBodyContent = ({
  control,
  errors,
  clearErrors,
  setError,
  isVisionPromptSubmitLoading,
}: {
  control: Control<VisionPromptInputs>
  errors: FieldErrors<VisionPromptInputs>
  clearErrors: UseFormClearErrors<VisionPromptInputs>
  setError: UseFormSetError<VisionPromptInputs>
  isVisionPromptSubmitLoading: boolean
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.magicFormBuilder.promptModal.pdfTab',
  })

  return (
    <>
      <FormControl isInvalid={!!errors.attachment?.message}>
        <FormLabel textStyle="subhead-1">{t('uploadLabel')}</FormLabel>
        <Controller
          name="attachment"
          control={control}
          rules={{ required: t('uploadError') }}
          render={({ field: { onChange, ...rest } }) => (
            <Attachment
              {...rest}
              onChange={(event) => {
                clearErrors('attachment')
                onChange(event)
              }}
              accept=".pdf"
              showFileSize
              fileConstraintsText={t('fileConstraints', {
                maxPages: MFB_VISION_MAX_IMAGES_COUNT,
              })}
              showRemove
              isRemoveDisabled={isVisionPromptSubmitLoading}
              onError={(message) => setError('attachment', { message })}
            />
          )}
        />
        <FormErrorMessage>{errors.attachment?.message}</FormErrorMessage>
      </FormControl>
    </>
  )
}

enum PROMPT_TYPE {
  TEXT,
  VISION,
}

const MagicFormBuilderCreateFormPrompt = ({
  onTextPromptSubmit,
  isTextPromptSubmitLoading,
  onVisionPromptSubmit,
  isVisionPromptSubmitLoading,
  onCancel,
}: {
  onTextPromptSubmit: MagicFormBuilderPromptModalProps['onTextPromptSubmit']
  isTextPromptSubmitLoading: MagicFormBuilderPromptModalProps['isTextPromptSubmitLoading']
  onVisionPromptSubmit: MagicFormBuilderPromptModalProps['onVisionPromptSubmit']
  isVisionPromptSubmitLoading: MagicFormBuilderPromptModalProps['isVisionPromptSubmitLoading']
  onCancel: () => void
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.magicFormBuilder.promptModal',
  })
  const { t: tPdf } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.magicFormBuilder.promptModal.pdfTab',
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TextPromptInputs>()

  const {
    control: visionControl,
    formState: { errors: visionErrors },
    clearErrors: clearVisionErrors,
    setError: setVisionError,
    handleSubmit: handleVisionSubmit,
  } = useForm<VisionPromptInputs>()

  const [selectedTab, setSelectedTab] = useState<PROMPT_TYPE>(
    isVisionPromptSubmitLoading ? PROMPT_TYPE.VISION : PROMPT_TYPE.TEXT,
  )

  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'

  const isMfbTextEnabled = useFeatureIsOn(featureFlags.mfb)
  const isMfbVisionEnabled = useFeatureIsOn(featureFlags.mfbVision)

  return (
    <>
      <ModalHeader display="flex" alignItems="center">
        <Text textStyle="h2">{t('header')}</Text>
      </ModalHeader>
      <ModalBody>
        <>
          {isTest || (isMfbTextEnabled && isMfbVisionEnabled) ? (
            <Tabs isFitted index={selectedTab} onChange={setSelectedTab}>
              <TabList px="2px" mb="1rem">
                <Tab
                  isDisabled={isVisionPromptSubmitLoading}
                  value={PROMPT_TYPE.TEXT}
                >
                  {t('tabs.text')}
                </Tab>
                <Tab
                  isDisabled={isTextPromptSubmitLoading}
                  value={PROMPT_TYPE.VISION}
                >
                  {t('tabs.pdf')}
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <TextPromptModalBodyContent
                    register={register}
                    setValue={setValue}
                    errors={errors}
                  />
                </TabPanel>
                <TabPanel>
                  <VisionPromptModalBodyContent
                    control={visionControl}
                    errors={visionErrors}
                    clearErrors={clearVisionErrors}
                    setError={setVisionError}
                    isVisionPromptSubmitLoading={isVisionPromptSubmitLoading}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          ) : isMfbTextEnabled ? (
            <TextPromptModalBodyContent
              register={register}
              setValue={setValue}
              errors={errors}
            />
          ) : isMfbVisionEnabled ? (
            <VisionPromptModalBodyContent
              control={visionControl}
              errors={visionErrors}
              clearErrors={clearVisionErrors}
              setError={setVisionError}
              isVisionPromptSubmitLoading={isVisionPromptSubmitLoading}
            />
          ) : null}
        </>
      </ModalBody>
      <ModalFooter justifyContent="flex-end">
        <NextAndBackButtonGroup
          nextButtonIcon={<BiSolidMagicWand fontSize="1.5rem" />}
          handleNext={
            selectedTab === PROMPT_TYPE.TEXT
              ? handleSubmit(({ prompt }) => {
                  onTextPromptSubmit(prompt)
                })
              : handleVisionSubmit(async ({ attachment }) => {
                  try {
                    const pdfData = await attachment.arrayBuffer()
                    const imageDataUrls =
                      await pdfBinaryToImageDataUrls(pdfData)

                    if (imageDataUrls.length > MFB_VISION_MAX_IMAGES_COUNT) {
                      setVisionError('attachment', {
                        type: 'manual',
                        message: tPdf('conversionError.fileSizeTooLarge'),
                      })
                      return
                    }
                    onVisionPromptSubmit(imageDataUrls)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  } catch (error) {
                    setVisionError('attachment', {
                      type: 'manual',
                      message: tPdf('conversionError.unknown'),
                    })
                  }
                })
          }
          isNextLoading={
            isTextPromptSubmitLoading || isVisionPromptSubmitLoading
          }
          isBackDisabled={
            isTextPromptSubmitLoading || isVisionPromptSubmitLoading
          }
          handleBack={onCancel}
          nextButtonLabel={t('actions.create')}
          backButtonLabel={t('actions.cancel')}
        />
      </ModalFooter>
    </>
  )
}

interface MagicFormBuilderPromptModalProps {
  isOpen: boolean
  onTextPromptSubmit: (textPrompt: string) => void
  isTextPromptSubmitLoading: boolean
  onVisionPromptSubmit: (imageDataUrls: string[]) => void
  isVisionPromptSubmitLoading: boolean
  onClose: () => void
}

const MagicFormBuilderPromptModal = ({
  isOpen,
  onTextPromptSubmit,
  isTextPromptSubmitLoading,
  onVisionPromptSubmit,
  isVisionPromptSubmitLoading,
  onClose,
}: MagicFormBuilderPromptModalProps): JSX.Element => {
  const isLoading = isTextPromptSubmitLoading || isVisionPromptSubmitLoading

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={!isLoading}
      closeOnEsc={!isLoading}
    >
      <ModalOverlay />
      <ModalContent>
        <>{!isLoading ? <ModalCloseButton /> : null}</>
        <MagicFormBuilderCreateFormPrompt
          onTextPromptSubmit={onTextPromptSubmit}
          isTextPromptSubmitLoading={isTextPromptSubmitLoading}
          onVisionPromptSubmit={onVisionPromptSubmit}
          isVisionPromptSubmitLoading={isVisionPromptSubmitLoading}
          onCancel={onClose}
        />
      </ModalContent>
    </Modal>
  )
}

export default MagicFormBuilderPromptModal

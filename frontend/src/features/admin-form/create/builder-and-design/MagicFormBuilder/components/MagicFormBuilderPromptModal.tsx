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

import Badge from '~components/Badge'
import { NextAndBackButtonGroup } from '~components/Button'
import Attachment from '~components/Field/Attachment'

import { useUser } from '~features/user/queries'

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
  return (
    <Flex direction="column">
      <Text textStyle="subhead-1">Need inspiration? Try one of these:</Text>
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

const GENERATE_FORM_PLACEHOLDER =
  'Describe your form, including fields and sections to create'

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
  return (
    <>
      <FormControl isRequired isInvalid={!!errors.prompt?.message}>
        <FormLabel textStyle="subhead-1">
          I want to create a form that collects...
        </FormLabel>
        <Textarea
          minH="9rem"
          borderRadius="4px"
          placeholder={GENERATE_FORM_PLACEHOLDER}
          {...register('prompt', {
            required: 'Please enter a prompt',
            maxLength: {
              value: 500,
              message: 'Please enter at most 500 characters',
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
}: {
  control: Control<VisionPromptInputs>
  errors: FieldErrors<VisionPromptInputs>
  clearErrors: UseFormClearErrors<VisionPromptInputs>
  setError: UseFormSetError<VisionPromptInputs>
}) => {
  return (
    <>
      <FormControl isRequired isInvalid={!!errors.attachment?.message}>
        <FormLabel textStyle="subhead-1">
          Create a form based on this pdf
        </FormLabel>
        <Controller
          name="attachment"
          control={control}
          rules={{ required: 'Please upload a pdf file' }}
          render={({ field: { onChange, ...rest } }) => (
            <Attachment
              {...rest}
              onChange={(event) => {
                clearErrors('attachment')
                onChange(event)
              }}
              accept=".pdf"
              showFileSize
              showRemove
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

  const [selectedTab, setSelectedTab] = useState<PROMPT_TYPE>(PROMPT_TYPE.TEXT)

  const { user, isLoading: isUserLoading } = useUser()

  return (
    <>
      <ModalHeader display="flex" alignItems="center">
        <Text textStyle="h2">Create fields with AI</Text>
        <Badge
          colorScheme="primary"
          variant="subtle"
          color="secondary.500"
          ml="0.5rem"
        >
          Beta
        </Badge>
      </ModalHeader>
      <ModalBody>
        {!isUserLoading && user?.betaFlags?.mfbVision ? (
          <Tabs isFitted onChange={setSelectedTab}>
            <TabList mb="1em">
              <Tab value={PROMPT_TYPE.TEXT}>Text</Tab>
              <Tab value={PROMPT_TYPE.VISION}>Pdf</Tab>
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
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        ) : (
          <TextPromptModalBodyContent
            register={register}
            setValue={setValue}
            errors={errors}
          />
        )}
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

                    if (imageDataUrls.length > 10) {
                      setVisionError('attachment', {
                        type: 'manual',
                        message:
                          'Your pdf file must have less than or equal 10 pages.',
                      })
                      return
                    }
                    onVisionPromptSubmit(imageDataUrls)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  } catch (error) {
                    setVisionError('attachment', {
                      type: 'manual',
                      message: 'Failed to convert PDF file to images.',
                    })
                  }
                })
          }
          isNextLoading={
            isTextPromptSubmitLoading || isVisionPromptSubmitLoading
          }
          handleBack={onCancel}
          nextButtonLabel="Create fields"
          backButtonLabel="Cancel"
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
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
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

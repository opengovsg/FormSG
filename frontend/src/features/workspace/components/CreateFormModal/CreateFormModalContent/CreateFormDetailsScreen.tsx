import { SetStateAction, useCallback, useState } from 'react'
import { Controller } from 'react-hook-form'
import { BiRightArrowAlt } from 'react-icons/bi'
import { FaMagic } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import {
  Center,
  Container,
  Flex,
  FormControl,
  ModalBody,
  ModalHeader,
  Skeleton,
  Spacer,
  Stack,
  Text,
} from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form/form'

import { GUIDE_PREVENT_EMAIL_BOUNCE } from '~constants/links'
import { ADMINFORM_ROUTE } from '~constants/routes'
import { FORM_TITLE_VALIDATION_RULES } from '~utils/formValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormFieldMessage from '~components/FormControl/FormFieldMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Textarea from '~components/Textarea'

import { useReformMutations } from '~features/admin-form/reform/mutations'
import { parseModelOutput } from '~features/admin-form/reform/utils'
import { useUser } from '~features/user/queries'
import { useCreateFormMutations } from '~features/workspace/mutations'

import { useCreateFormWizard } from '../CreateFormWizardContext'

import { EmailFormRecipientsInput } from './EmailFormRecipientsInput'
import { FormResponseOptions } from './FormResponseOptions'

/** The length of form title to start showing warning text */
const FORM_TITLE_LENGTH_WARNING = 65

export const CreateFormDetailsScreen = (): JSX.Element => {
  const {
    formMethods,
    handleDetailsSubmit,
    isLoading,
    isFetching,
    modalHeader,
    containsMyInfoFields,
  } = useCreateFormWizard()
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = formMethods

  const titleInputValue = watch('title')
  const responseModeValue = watch('responseMode')

  const [standardFlow, setStandardFlow] = useState(true)
  const [purpose, setPurpose] = useState('')

  const handlePurposeChange = (event: {
    target: { value: SetStateAction<string> }
  }) => setPurpose(event.target.value)

  const { getQuestionsListMutation, getFormFieldsMutation } =
    useReformMutations()

  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false)

  const [qnsList, setQnsList] = useState('')

  const [prevMessages, setPrevMessages] = useState<
    { role: string; content: string }[]
  >([])

  const handlePurposeEnter = useCallback(() => {
    setIsFetchingQuestions(true)
    return getQuestionsListMutation.mutate(purpose, {
      onSuccess: (data) => {
        setQnsList(parseModelOutput(data[data.length - 1].content))
        setPrevMessages(data)
      },
      onSettled: () => {
        setIsFetchingQuestions(false)
      },
    })
  }, [getQuestionsListMutation, purpose])

  const [formName, setFormName] = useState('')

  const handleFormNameChange = (event: {
    target: { value: SetStateAction<string> }
  }) => setFormName(event.target.value)

  const { user } = useUser()

  const navigate = useNavigate()

  const [isCreatingForm, setIsCreatingForm] = useState(false)

  const handleQuestionsChange = (event: {
    target: { value: SetStateAction<string> }
  }) => setQnsList(event.target.value)

  const handleCreateFormFromQnsList = useCallback(() => {
    setIsCreatingForm(true)
    return getFormFieldsMutation.mutate(
      {
        purpose,
        prevMessages,
        questions: qnsList,
        formName,
        email: user?.email ?? 'example@open.gov.sg',
      },
      {
        onSuccess: (data) => {
          navigate(`${ADMINFORM_ROUTE}/${data._id}`)
        },
        onSettled: () => {
          setIsCreatingForm(false)
        },
      },
    )
  }, [
    formName,
    getFormFieldsMutation,
    navigate,
    prevMessages,
    purpose,
    qnsList,
    user?.email,
  ])

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="42.5rem" p={0}>
          <Flex>
            <Center>
              <Text>{modalHeader}</Text>
            </Center>
            <Spacer />
            <Button
              rightIcon={standardFlow ? <FaMagic /> : <BiRightArrowAlt />}
              onClick={() => setStandardFlow(!standardFlow)}
            >
              <Text lineHeight="1.5rem">
                {standardFlow ? 'Build with AI' : 'Go back'}
              </Text>
            </Button>
          </Flex>
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="42.5rem" p={0}>
          {standardFlow ? (
            <Flex direction="column">
              <FormControl isRequired isInvalid={!!errors.title} mb="2.25rem">
                <FormLabel useMarkdownForDescription>Form name</FormLabel>
                <Skeleton isLoaded={!isFetching}>
                  <Input
                    autoFocus
                    {...register('title', FORM_TITLE_VALIDATION_RULES)}
                  />
                </Skeleton>
                <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
                {titleInputValue?.length > FORM_TITLE_LENGTH_WARNING ? (
                  <FormFieldMessage>
                    It is advised to use a shorter, more succinct form name.
                  </FormFieldMessage>
                ) : null}
              </FormControl>
              <FormControl
                isRequired
                isInvalid={!!errors.responseMode}
                mb="2.5rem"
              >
                <FormLabel>
                  How do you want to receive your form responses?
                </FormLabel>
                <Skeleton isLoaded={!isFetching}>
                  <Controller
                    name="responseMode"
                    control={control}
                    render={({ field }) => (
                      <FormResponseOptions
                        containsMyInfoFields={containsMyInfoFields}
                        {...field}
                      />
                    )}
                    rules={{ required: 'Please select a form response mode' }}
                  />
                </Skeleton>
                <FormErrorMessage>
                  {errors.responseMode?.message}
                </FormErrorMessage>
              </FormControl>
              {containsMyInfoFields && (
                <InlineMessage useMarkdown mt="-1rem" mb="1rem">
                  {`This form contains MyInfo fields. Only **Email** mode is supported at
              this point.`}
                </InlineMessage>
              )}
              {responseModeValue === FormResponseMode.Email && (
                <FormControl
                  isRequired
                  isInvalid={!!errors.emails}
                  mb="2.25rem"
                >
                  <FormLabel
                    useMarkdownForDescription
                    description={`Specify up to 30 emails. [How to guard against bounce emails](${GUIDE_PREVENT_EMAIL_BOUNCE}).`}
                  >
                    Emails where responses will be sent
                  </FormLabel>
                  <EmailFormRecipientsInput />
                </FormControl>
              )}
              <Button
                rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
                type="submit"
                isLoading={isLoading}
                isDisabled={isFetching}
                onClick={handleDetailsSubmit}
                isFullWidth
              >
                <Text lineHeight="1.5rem">Next step</Text>
              </Button>
            </Flex>
          ) : (
            <Flex direction="column">
              <FormControl isRequired mb="2.25rem">
                <FormLabel description="You can change this later.">
                  Form name
                </FormLabel>
                <Skeleton isLoaded={!isFetching}>
                  <Input value={formName} onChange={handleFormNameChange} />
                </Skeleton>
                <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
                {titleInputValue?.length > FORM_TITLE_LENGTH_WARNING ? (
                  <FormFieldMessage>
                    It is advised to use a shorter, more succinct form name.
                  </FormFieldMessage>
                ) : null}
              </FormControl>
              <FormControl isRequired mb="2.25rem">
                <FormLabel description="e.g. I want to create a form that collect personal details">
                  I want to create a form that...
                </FormLabel>
                <Skeleton isLoaded={!isFetching}>
                  <Stack direction="row">
                    <Input value={purpose} onChange={handlePurposeChange} />
                    <Spacer />
                    <Button
                      onClick={handlePurposeEnter}
                      isLoading={isFetchingQuestions}
                    >
                      Enter
                    </Button>
                  </Stack>
                </Skeleton>
              </FormControl>
              {isFetchingQuestions ? (
                <Text>
                  Generating list of questions, this will take ~1 min.
                </Text>
              ) : null}
              {qnsList ? (
                <FormControl isRequired mb="2.25rem">
                  <FormLabel>
                    These are the questions the form should have:
                  </FormLabel>
                  <Skeleton isLoaded={!isFetching}>
                    <Stack direction="row">
                      <Textarea
                        value={qnsList}
                        onChange={handleQuestionsChange}
                      />
                    </Stack>
                  </Skeleton>
                </FormControl>
              ) : null}
              {isCreatingForm ? <Text>This will take ~3 mins...</Text> : null}
              <Button
                rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
                type="submit"
                isLoading={isCreatingForm}
                isDisabled={!qnsList}
                onClick={handleCreateFormFromQnsList}
                isFullWidth
              >
                <Text lineHeight="1.5rem">Next step</Text>
              </Button>
            </Flex>
          )}
        </Container>
      </ModalBody>
    </>
  )
}

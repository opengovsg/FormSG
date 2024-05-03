import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { BiBulb } from 'react-icons/bi'
import { Flex, FormControl, Icon } from '@chakra-ui/react'
import {
  FormErrorMessage,
  FormLabel,
  TagInput,
} from '@opengovsg/design-system-react'
import { get, isEmpty, isEqual } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { GUIDE_FORM_MRF, GUIDE_PREVENT_EMAIL_BOUNCE } from '~constants/links'
import { useMdComponents } from '~hooks/useMdComponents'
import { ADMIN_EMAIL_VALIDATION_RULES } from '~utils/formValidation'
import { MarkdownText } from '~components/MarkdownText'

import { useMutateFormSettings } from '../mutations'

interface EmailFormSectionProps {
  emails: string[]
}

export const EmailFormSection = ({
  emails: initialEmails,
}: EmailFormSectionProps): JSX.Element => {
  const initialEmailSet = useMemo(() => new Set(initialEmails), [initialEmails])
  const formMethods = useForm({
    mode: 'onChange',
    defaultValues: { emails: initialEmails },
  })

  const {
    formState: { errors },
    reset,
  } = formMethods

  const { mutateFormEmails } = useMutateFormSettings()

  const handleSubmitEmails = useCallback(
    ({ emails }: { emails: string[] }) => {
      if (isEqual(new Set(emails.filter(Boolean)), initialEmailSet)) return
      return mutateFormEmails.mutate(emails)
    },
    [initialEmailSet, mutateFormEmails],
  )

  useEffect(() => reset({ emails: initialEmails }), [initialEmails, reset])

  return (
    <>
      <MRFAdvertisingInfobox />
      <FormProvider {...formMethods}>
        <FormControl isInvalid={!isEmpty(errors)}>
          <FormLabel
            isRequired
            description={
              <MarkdownText>{`Add at least **2 recipients** to prevent loss of response. Learn more on [how to guard against email bounces](${GUIDE_PREVENT_EMAIL_BOUNCE}).`}</MarkdownText>
            }
          >
            Emails where responses will be sent
          </FormLabel>
          <AdminEmailRecipientsInput onSubmit={handleSubmitEmails} />
          <FormErrorMessage>{get(errors, 'emails.message')}</FormErrorMessage>
        </FormControl>
      </FormProvider>
    </>
  )
}

const MRFAdvertisingInfobox = () => {
  const mdComponents = useMdComponents()

  return (
    <Flex bg="brand.primary.50" p="1rem">
      <Icon
        as={BiBulb}
        color="brand.primary.500"
        fontSize="1.5rem"
        mr="0.5rem"
      />
      <MarkdownText
        components={mdComponents}
      >{`Require routing and approval? [Check out our new feature: Multi-respondent forms!](${GUIDE_FORM_MRF})`}</MarkdownText>
    </Flex>
  )
}

interface AdminEmailRecipientsInputProps {
  onSubmit: (params: { emails: string[] }) => void
}

const AdminEmailRecipientsInput = ({
  onSubmit,
}: AdminEmailRecipientsInputProps): JSX.Element => {
  const { getValues, setValue, control, handleSubmit } = useFormContext<{
    emails: string[]
  }>()

  const tagValidation = useMemo(() => isEmail, [])

  const handleBlur = useCallback(() => {
    // Get rid of bad tags before submitting.
    setValue(
      'emails',
      getValues('emails').filter((email) => tagValidation(email)),
    )
    handleSubmit(onSubmit)()
  }, [getValues, handleSubmit, onSubmit, setValue, tagValidation])

  return (
    <Controller
      control={control}
      name="emails"
      rules={ADMIN_EMAIL_VALIDATION_RULES}
      render={({ field }) => (
        <TagInput
          placeholder="Separate emails with a comma"
          {...field}
          tagValidation={tagValidation}
          onBlur={handleBlur}
        />
      )}
    />
  )
}

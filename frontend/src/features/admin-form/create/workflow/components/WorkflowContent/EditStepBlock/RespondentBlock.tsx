import { Controller, UseFormReturn } from 'react-hook-form'
import { As, Box, Flex, FormControl, Icon, Stack, Text } from '@chakra-ui/react'
import { get } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { WorkflowType } from '~shared/types'

import { BxsInfoCircleAlt } from '~assets/icons/BxsInfoCircleAlt'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Radio from '~components/Radio'
import { TagInput } from '~components/TagInput'
import Tooltip from '~components/Tooltip'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

interface RespondentBlockProps {
  stepNumber: number
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
}

export const RespondentBlock = ({
  stepNumber,
  isLoading,
  formMethods,
}: RespondentBlockProps): JSX.Element => {
  const {
    formState: { errors },
    register,
    getValues,
    control,
  } = formMethods

  const { emailFormFields = [] } = useAdminFormWorkflow()

  const emailFieldItems = emailFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )

  const defaultWorkflowType = getValues('workflow_type')

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  return (
    <Stack
      direction="column"
      spacing="0.75rem"
      py="1.5rem"
      px={{ base: '1.5rem', md: '2rem' }}
    >
      {isFirstStep ? (
        <>
          <Flex alignItems="center" gap="0.5rem">
            <Text textStyle="subhead-3">Respondent in this step</Text>
            <Tooltip
              placement="top"
              label="Anyone you share the form link with"
            >
              <Icon as={BxsInfoCircleAlt} />
            </Tooltip>
          </Flex>
          <FormControl isInvalid={!!errors.field}>
            <FormLabel>
              Add an email field for notifications to be sent to this respondent
            </FormLabel>
            <Box my="0.75rem">
              <Controller
                name="field"
                rules={{
                  validate: (selectedValue) => {
                    return (
                      !selectedValue ||
                      !emailFieldItems ||
                      emailFieldItems.some(
                        ({ value: fieldValue }) => fieldValue === selectedValue,
                      ) ||
                      'Field is not an email field'
                    )
                  },
                }}
                control={control}
                render={({ field: { value = '', ...rest } }) => (
                  <SingleSelect
                    placeholder="Select an email field from your form"
                    items={emailFieldItems}
                    value={value}
                    isClearable
                    {...rest}
                  />
                )}
              />
            </Box>
            <FormErrorMessage>{errors.field?.message}</FormErrorMessage>
          </FormControl>
        </>
      ) : (
        <>
          <Text textStyle="subhead-3">Respondent in this step</Text>
          <FormControl
            isReadOnly={isLoading}
            id="workflowType"
            isRequired
            isInvalid={!!errors.workflow_type}
          >
            <Radio.RadioGroup defaultValue={defaultWorkflowType}>
              <Flex flexDir="row" justifyContent="space-between">
                <Flex>
                  <Radio
                    isDisabled={isLoading}
                    allowDeselect={false}
                    value={WorkflowType.Static}
                    {...register('workflow_type')}
                    px="8px"
                  >
                    Enter specific email(s)
                  </Radio>
                </Flex>
                <Flex>
                  <Radio
                    isDisabled={isLoading}
                    allowDeselect={false}
                    value={WorkflowType.Dynamic}
                    {...register('workflow_type')}
                    px="8px"
                  >
                    Select an email field from your form
                  </Radio>
                </Flex>
              </Flex>
            </Radio.RadioGroup>
            <FormErrorMessage>{errors.workflow_type?.message}</FormErrorMessage>
          </FormControl>

          <RespondentInput
            isLoading={isLoading}
            formMethods={formMethods}
            emailFieldItems={emailFieldItems}
          />
        </>
      )}
    </Stack>
  )
}

interface RespondentInputProps
  extends Omit<RespondentBlockProps, 'stepNumber'> {
  emailFieldItems: {
    label: string
    value: string
    icon?: As
  }[]
}

const RespondentInput = ({
  isLoading,
  formMethods,
  emailFieldItems,
}: RespondentInputProps) => {
  const {
    formState: { errors },
    control,
    watch,
  } = formMethods

  const watchedWorkflowType = watch('workflow_type')

  const staticTagInputErrorMessage = get(errors, 'emails.message')

  switch (watchedWorkflowType) {
    case WorkflowType.Static:
      return (
        <FormControl
          isReadOnly={isLoading}
          id="emails"
          isRequired
          isInvalid={!!errors.emails}
          key="emails"
        >
          <Controller
            name="emails"
            control={control}
            rules={{
              validate: {
                required: (emails) =>
                  !emails || emails.length === 0
                    ? 'You must enter at least one email to receive responses'
                    : true,
                isEmails: (emails) =>
                  !emails ||
                  emails.every((email) => isEmail(email)) ||
                  'Please enter valid email(s) (e.g. me@example.com) separated by commas, as invalid emails will not be saved',
              },
            }}
            render={({ field }) => (
              <TagInput
                isDisabled={isLoading}
                placeholder="me@example.com"
                tagValidation={isEmail}
                {...field}
              />
            )}
          />
          {staticTagInputErrorMessage ? (
            <FormErrorMessage>{staticTagInputErrorMessage}</FormErrorMessage>
          ) : (
            <Text textStyle="body-2" my="0.5rem" py="0.125rem">
              Separate multiple emails with a comma
            </Text>
          )}
        </FormControl>
      )
    case WorkflowType.Dynamic:
      return (
        <FormControl
          isReadOnly={isLoading}
          id="field"
          isRequired
          isInvalid={!!errors.field}
        >
          <Controller
            control={control}
            name="field"
            rules={{
              required: 'Please select a field',
              validate: (selectedValue) =>
                !emailFieldItems ||
                emailFieldItems.some(
                  ({ value: fieldValue }) => fieldValue === selectedValue,
                ) ||
                'Field is not an email field',
            }}
            render={({ field: { value = '', ...rest } }) => (
              <SingleSelect
                isDisabled={isLoading}
                isClearable={false}
                placeholder="Select a field"
                items={emailFieldItems}
                value={value}
                {...rest}
              />
            )}
          />
          <FormErrorMessage>{errors.field?.message}</FormErrorMessage>
        </FormControl>
      )
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = watchedWorkflowType
      throw new Error('Invalid workflow type')
    }
  }
}

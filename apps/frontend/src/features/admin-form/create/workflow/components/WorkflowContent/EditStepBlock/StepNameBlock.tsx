import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'

import { textStyles } from '~theme/textStyles'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'

import { EditStepInputs } from '../../../types'

import { EditStepBlockContainer } from './EditStepBlockContainer'

type StepNameProps = {
  stepNumber: number
  formMethods: UseFormReturn<EditStepInputs>
  showGuidedHint?: boolean
  guidedHintText?: string
}

const STEP_NAME = 'step_name'
const MAX_CHAR = 50

export const StepNameBlock = ({
  stepNumber,
  formMethods,
  showGuidedHint,
  guidedHintText,
}: StepNameProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    formState: { errors },
    control,
    watch,
    trigger,
  } = formMethods

  const customStepName = watch(STEP_NAME)

  const displayStepName = customStepName
    ? customStepName
    : `Step ${stepNumber + 1}`

  return (
    <EditStepBlockContainer>
      <Stack spacing="1.5rem">
        <Box>
          <Text
            display="inline-block"
            py="0.5rem"
            px="1rem"
            borderWidth="1px"
            borderColor="secondary.300"
            borderRadius="4px"
            textStyle="subhead-3"
          >
            {stepNumber + 1}
          </Text>
        </Box>
        <Box>
          <FormControl
            id={STEP_NAME}
            isRequired={false}
            isInvalid={!!errors[STEP_NAME]}
          >
            <FormLabel isRequired style={textStyles.h4} textStyle={'subhead-1'}>
              {t('features.adminForm.sidebar.workflow.stepName.label')}
            </FormLabel>
            <Controller
              control={control}
              name={STEP_NAME}
              rules={{
                maxLength: {
                  value: MAX_CHAR,
                  message: `Please keep the step name under ${MAX_CHAR} characters`,
                },
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={displayStepName}
                  _focus={{
                    _placeholder: { color: 'transparent' },
                  }}
                  onChange={(e) => {
                    field.onChange(e)
                    trigger(STEP_NAME)
                  }}
                />
              )}
            />
            {errors?.step_name ? (
              <FormErrorMessage>
                {errors.step_name.message} ({customStepName?.length}/{MAX_CHAR})
              </FormErrorMessage>
            ) : customStepName ? (
              <FormHelperText color="secondary.400">
                {`(${customStepName?.length ?? 0}/${MAX_CHAR})`}
              </FormHelperText>
            ) : null}
          </FormControl>
          {showGuidedHint && (
            <InlineMessage variant="info" mt="0.75rem">
              {guidedHintText ||
                'Name it something to make it easier for you to know what this step is for later. Or keep it as "Step 1", we don\'t judge.'}
            </InlineMessage>
          )}
        </Box>
      </Stack>
    </EditStepBlockContainer>
  )
}

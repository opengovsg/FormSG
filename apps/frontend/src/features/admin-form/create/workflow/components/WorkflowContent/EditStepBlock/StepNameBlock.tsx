import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'

import Toggle from '~components/Toggle'

import { EditStepInputs } from '../../../types'

import { EditStepBlockContainer } from './EditStepBlockContainer'

type StepNameProps = {
  stepNumber: number
  formMethods: UseFormReturn<EditStepInputs>
  showGuidedHint?: boolean
  guidedHintText?: string
  guidedEdit?: boolean
  onToggleGuide?: () => void
  hideHeader?: boolean
}

const STEP_NAME = 'step_name'
const MAX_CHAR = 50

export const StepNameBlock = ({
  stepNumber,
  formMethods,
  showGuidedHint,
  guidedHintText,
  guidedEdit,
  onToggleGuide,
  hideHeader,
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
        {!hideHeader && (
          <Flex justifyContent="space-between" alignItems="center">
            <Text
              display="inline-block"
              py="0.5rem"
              px="1rem"
              borderWidth="1px"
              borderColor="secondary.300"
              borderRadius="8px"
              bg="white"
              textStyle="subhead-1"
            >
              {stepNumber + 1}
            </Text>
            {onToggleGuide && (
              <Flex alignItems="center" gap="0.5rem">
                <Text textStyle="caption-1" color="secondary.400">
                  Guided mode
                </Text>
                <Toggle.Switch
                  isChecked={guidedEdit}
                  onChange={onToggleGuide}
                  aria-label="Guided mode"
                />
              </Flex>
            )}
          </Flex>
        )}
        <Box>
          <FormControl
            id={STEP_NAME}
            isRequired={false}
            isInvalid={!!errors[STEP_NAME]}
          >
            <Text textStyle="subhead-2" mb={showGuidedHint ? '0' : '0.75rem'}>
              {t('features.adminForm.sidebar.workflow.stepName.label')}
            </Text>
            {showGuidedHint && (
              <Text
                textStyle="body-2"
                color="secondary.400"
                mt="0.25rem"
                mb="0.75rem"
              >
                {guidedHintText ||
                  'Edit the step name to tell steps apart. This name shows up in the status tracker too.'}
              </Text>
            )}
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
        </Box>
      </Stack>
    </EditStepBlockContainer>
  )
}

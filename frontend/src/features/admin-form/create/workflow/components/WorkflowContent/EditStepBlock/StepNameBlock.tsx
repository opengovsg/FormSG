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

import { EditStepInputs } from '../../../types'

import { EditStepBlockContainer } from './EditStepBlockContainer'

type StepNameProps = {
  stepNumber: number
  formMethods: UseFormReturn<EditStepInputs>
}

const STEP_NAME = 'step_name'
const MAX_CHAR = 50

export const StepNameBlock = ({
  stepNumber,
  formMethods,
}: StepNameProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    formState: { errors },
    control,
    watch,
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
            <FormLabel
              isRequired
              style={textStyles.h4}
              textStyle={'subhead-1'}
              description={t(
                'features.adminForm.sidebar.workflow.stepName.description',
              )}
            >
              {t('features.adminForm.sidebar.workflow.stepName.label')}
            </FormLabel>
            <Controller
              control={control}
              name={STEP_NAME}
              rules={{
                maxLength: {
                  value: MAX_CHAR,
                  message: 'Please keep the step name under 50 characters',
                },
              }}
              render={({ field }) => (
                <Input
                  // utilizing placeholder to mimic default step name
                  placeholder={displayStepName}
                  _placeholder={{ color: 'secondary.700' }}
                  _focus={{
                    _placeholder: { color: 'transparent' },
                  }}
                  {...field}
                />
              )}
            />
            {errors?.step_name ? (
              <FormErrorMessage>{errors.step_name.message}</FormErrorMessage>
            ) : customStepName ? (
              <FormHelperText color="secondary.400">
                {MAX_CHAR - (customStepName?.length ?? 0)} characters left
              </FormHelperText>
            ) : null}
          </FormControl>
        </Box>
      </Stack>
    </EditStepBlockContainer>
  )
}

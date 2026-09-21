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

import FormLabel from '~components/FormControl/FormLabel'
import { textStyles } from '~theme/textStyles'

import { useWorkflowSurfaces } from '../../../hooks/useWorkflowSurfaces'
import { EditStepInputs } from '../../../types'
import { useIsSpotlightActiveSection } from '../../Spotlight'
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
  const { cardRadius, stepLabelTextStyle } = useWorkflowSurfaces()
  const isActiveSection = useIsSpotlightActiveSection()
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
            borderRadius={cardRadius}
            textStyle={stepLabelTextStyle}
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
            {isActiveSection && stepNumber > 0 ? (
              <Text textStyle="body-2" color="secondary.400" mb="0.5rem">
                {t('features.adminForm.sidebar.workflow.guidedHints.stepName', {
                  stepNumber: stepNumber + 1,
                })}
              </Text>
            ) : null}
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

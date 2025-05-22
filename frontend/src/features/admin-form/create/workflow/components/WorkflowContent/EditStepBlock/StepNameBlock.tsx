import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Box,
  FormControl,
  FormHelperText,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'

import { textStyles } from '~theme/textStyles'
import FormLabel from '~components/FormControl/FormLabel'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { EditStepInputs } from '../../../types'
import { StepLabel } from '../StepLabel'

import { EditStepBlockContainer } from './EditStepBlockContainer'

type StepNameProps = {
  stepNumber: number
  formMethods: UseFormReturn<EditStepInputs>
}

const STEP_NAME = 'step_name'

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
      <Box>
        <Text
          display="inline-block"
          py="0.5rem"
          px="1rem"
          borderWidth="1px"
          borderColor="secondary.300"
          borderRadius="4px"
        >
          {stepNumber + 1}
        </Text>
      </Box>
      <Box>
        <FormControl id={STEP_NAME} isRequired>
          <FormLabel
            textStyle={'subhead-1'}
            description={t(
              'features.adminForm.sidebar.workflow.stepName.description',
            )}
          >
            {t('features.adminForm.sidebar.workflow.stepName.label')}
          </FormLabel>
          <Controller
            control={control}
            name={STEP_NAME} // check this
            render={() => (
              <Input
                id={STEP_NAME}
                placeholder={displayStepName}
                _placeholder={{ color: 'secondary.700' }} // check this
              />
            )}
          />
        </FormControl>
      </Box>
    </EditStepBlockContainer>
  )
}

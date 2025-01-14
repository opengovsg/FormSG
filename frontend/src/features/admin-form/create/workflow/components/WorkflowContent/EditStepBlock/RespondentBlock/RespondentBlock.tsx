import { UseFormReturn } from 'react-hook-form'
import { FormControl, Stack, Text } from '@chakra-ui/react'

import { UserDto } from '~shared/types'

import { textStyles } from '~theme/textStyles'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Radio from '~components/Radio'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'
import { useUser } from '~features/user/queries'

import { useAdminFormWorkflow } from '../../../../hooks/useAdminFormWorkflow'
import { isFirstStepByStepNumber } from '../../utils/isFirstStepByStepNumber'
import { EditStepBlockContainer } from '../EditStepBlockContainer'

import { ConditionalRoutingOption } from './Components/ConditionalRoutingOption'
import { DynamicRespondentOption } from './Components/DynamicRespondentOption'
import { StaticRespondentOption } from './Components/StaticRespondentOption'

interface RespondentBlockProps {
  stepNumber: number
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  user: UserDto | undefined
}

export const RespondentBlock = ({
  stepNumber,
  isLoading,
  formMethods,
}: RespondentBlockProps): JSX.Element => {
  const {
    formState: { errors },
    watch,
  } = formMethods

  // TODO (MRF-Conditional-Routing): Remove isTest and user/useUser when conditional routing is out of beta
  const { user } = useUser()
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'

  const { emailFormFields = [], dropdownFormFields = [] } =
    useAdminFormWorkflow()

  const emailFieldItems = emailFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )

  const selectedWorkflowType = watch('workflow_type')

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  return (
    <EditStepBlockContainer>
      {isFirstStep ? (
        <Stack spacing="0.5rem">
          <Text style={textStyles.h4}>Respondent in this step</Text>
          <Text>Anyone who has access to your form</Text>
        </Stack>
      ) : (
        <FormControl
          isReadOnly={isLoading}
          isRequired
          isInvalid={!!errors.workflow_type}
        >
          <FormLabel style={textStyles.h4}>Select a respondent</FormLabel>
          <Stack spacing="0.25rem">
            <Radio.RadioGroup value={selectedWorkflowType}>
              <DynamicRespondentOption
                selectedWorkflowType={selectedWorkflowType}
                emailFieldItems={emailFieldItems}
                formMethods={formMethods}
                isLoading={isLoading}
              />
              <StaticRespondentOption
                selectedWorkflowType={selectedWorkflowType}
                formMethods={formMethods}
                isLoading={isLoading}
              />
              {/* TODO (MRF-Conditional-Routing): Remove isTest and user check when
              conditional routing is out of beta */}
              {isTest || user?.betaFlags?.mrfConditionalRouting ? (
                <>
                  <ConditionalRoutingOption
                    selectedWorkflowType={selectedWorkflowType}
                    conditionalFormFields={dropdownFormFields}
                    formMethods={formMethods}
                    isLoading={isLoading}
                  />
                </>
              ) : null}
            </Radio.RadioGroup>
          </Stack>
          <FormErrorMessage>{errors.workflow_type?.message}</FormErrorMessage>
        </FormControl>
      )}
    </EditStepBlockContainer>
  )
}

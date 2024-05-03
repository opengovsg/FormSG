import { Controller, UseFormReturn } from 'react-hook-form'
import { Flex, FormControl, Icon, Stack, Text } from '@chakra-ui/react'
import {
  FormErrorMessage,
  MultiSelect,
  TouchableTooltip,
} from '@opengovsg/design-system-react'

import { BxsInfoCircleAlt } from '~assets/icons'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { getLogicFieldLabel } from '~features/admin-form/create/logic/components/LogicContent/utils/getLogicFieldLabel'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'
import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'

interface QuestionsBlockProps {
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
}

export const QuestionsBlock = ({
  isLoading,
  formMethods,
}: QuestionsBlockProps): JSX.Element => {
  const { formFields = [], mapIdToField } = useAdminFormWorkflow()
  const {
    formState: { errors },
    control,
  } = formMethods

  const items = formFields
    .filter(
      (f) =>
        // Only retain actual inputs (exclude header, statement, image)
        !NON_RESPONSE_FIELD_SET.has(f.fieldType),
    )
    .map((f) => ({
      value: f._id,
      label: getLogicFieldLabel(mapIdToField[f._id]),
      icon: BASICFIELD_TO_DRAWER_META[f.fieldType].icon,
    }))

  return (
    <Stack
      direction="column"
      spacing="0.75rem"
      py="1.5rem"
      px={{ base: '1.5rem', md: '2rem' }}
      borderTopWidth="1px"
      borderTopColor="brand.secondary.200"
    >
      <Flex alignItems="center" gap="0.5rem">
        <Text textStyle="subhead-3">Fields to fill</Text>
        <TouchableTooltip label="Respondent will only be able to fill the fields you have selected">
          <Icon as={BxsInfoCircleAlt} />
        </TouchableTooltip>
      </Flex>

      <FormControl
        isReadOnly={isLoading}
        id="edit"
        isRequired
        isInvalid={!!errors.edit}
      >
        <Controller
          control={control}
          name="edit"
          render={({ field: { value, ...field } }) => (
            <MultiSelect
              isDisabled={isLoading}
              placeholder="Select questions from your form"
              items={items}
              values={value}
              {...field}
            />
          )}
        />
        <FormErrorMessage>{errors.workflow_type?.message}</FormErrorMessage>
      </FormControl>
    </Stack>
  )
}

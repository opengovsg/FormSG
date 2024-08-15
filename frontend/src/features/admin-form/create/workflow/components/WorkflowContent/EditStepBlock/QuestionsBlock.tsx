import { Controller, UseFormReturn } from 'react-hook-form'
import {
  Flex,
  FormControl,
  Icon,
  PlacementWithLogical,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { BxsInfoCircleAlt } from '~assets/icons'
import { MultiSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Tooltip from '~components/Tooltip'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { getLogicFieldLabel } from '~features/admin-form/create/logic/components/LogicContent/utils/getLogicFieldLabel'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'
import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'

interface QuestionsBlockProps {
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
}

type TooltipPlacement = PlacementWithLogical | undefined

export const QuestionsBlock = ({
  isLoading,
  formMethods,
}: QuestionsBlockProps): JSX.Element => {
  const tooltipPlacement: TooltipPlacement = useBreakpointValue({
    base: 'top',
    md: 'right',
  })
  const { formFields = [], idToFieldMap } = useAdminFormWorkflow()
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
      label: getLogicFieldLabel(idToFieldMap[f._id]),
      icon: BASICFIELD_TO_DRAWER_META[f.fieldType].icon,
    }))

  return (
    <Stack
      direction="column"
      spacing="0.75rem"
      py="1.5rem"
      px={{ base: '1.5rem', md: '2rem' }}
      borderTopWidth="1px"
      borderTopColor="secondary.200"
    >
      <Flex alignItems="center" gap="0.5rem">
        <Text textStyle="subhead-3">Fields to fill</Text>
        <Tooltip
          placement={tooltipPlacement}
          label="Respondent will only be able to fill the fields you have selected"
        >
          <Icon as={BxsInfoCircleAlt} />
        </Tooltip>
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
              placeholder="Select fields from your form"
              items={items}
              isSelectedItemFullWidth
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

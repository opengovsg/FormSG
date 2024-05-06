import { useCallback, useMemo } from 'react'
import {
  Controller,
  useFieldArray,
  useFormContext,
  useFormState,
} from 'react-hook-form'
import { BiPlus, BiTrash } from 'react-icons/bi'
import {
  FormControl,
  Grid,
  Stack,
  StackDivider,
  VisuallyHidden,
} from '@chakra-ui/react'
import {
  Button,
  ComboboxItem,
  FormErrorMessage,
  FormLabel,
  IconButton,
  Input,
  SingleSelect,
  Toggle,
} from '@opengovsg/design-system-react'
import { pick } from 'lodash'

import { BasicField, TableFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'

import { createShortTextColumn } from '~features/admin-form/create/builder-and-design/utils/columnCreation'

import { BASICFIELD_TO_DRAWER_META } from '../../../../../constants'

import { EditTableInputs } from './EditTable'
import { EditTableDropdown } from './EditTableDropdown'

const TABLE_COLUMN_DROPDOWN_OPTIONS: ComboboxItem<
  TableFieldBase['columns'][number]['columnType']
>[] = [
  {
    ...pick(BASICFIELD_TO_DRAWER_META[BasicField.ShortText], 'icon', 'label'),
    value: BasicField.ShortText,
  },
  {
    ...pick(BASICFIELD_TO_DRAWER_META[BasicField.Dropdown], 'icon', 'label'),
    value: BasicField.Dropdown,
  },
]

interface EditTableColumnsProps {
  isLoading: boolean
}

export const EditTableColumns = ({
  isLoading,
}: EditTableColumnsProps): JSX.Element => {
  const { register, control, getValues } = useFormContext<EditTableInputs>()
  const { errors } = useFormState<EditTableInputs>()
  const { fields, append, remove } = useFieldArray<EditTableInputs>({
    name: 'columns',
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  const handleAddColumn = useCallback(
    () => append(createShortTextColumn()),
    [append],
  )

  return (
    <Stack
      divider={<StackDivider borderColor="brand.secondary.100" />}
      spacing="2rem"
    >
      {fields.map((column, index) => (
        <Stack key={column.id} spacing="1rem">
          <FormControl
            isRequired
            isReadOnly={isLoading}
            isInvalid={!!errors?.columns?.[index]?.title}
          >
            <Grid templateColumns="1fr auto">
              <FormLabel>{`Column ${index + 1}`}</FormLabel>
              {fields.length !== 1 && (
                <IconButton
                  mt="-0.75rem"
                  variant="clear"
                  colorScheme="critical"
                  fontSize="1.25rem"
                  icon={<BiTrash />}
                  aria-label="Delete column"
                  onClick={() => remove(index)}
                />
              )}
            </Grid>
            <Input
              {...register(`columns.${index}.title`, requiredValidationRule)}
            />
            <FormErrorMessage>
              {errors?.columns?.[index]?.title?.message}
            </FormErrorMessage>
          </FormControl>
          <FormControl
            isRequired
            isReadOnly={isLoading}
            id={`columns.${index}.columnType`}
          >
            <VisuallyHidden>
              <FormLabel>Column type</FormLabel>
            </VisuallyHidden>
            <Controller
              name={`columns.${index}.columnType`}
              control={control}
              rules={requiredValidationRule}
              render={({ field }) => (
                <SingleSelect
                  isClearable={false}
                  items={TABLE_COLUMN_DROPDOWN_OPTIONS}
                  {...field}
                />
              )}
            />
            <FormErrorMessage>
              {errors?.columns?.[index]?.columnType?.message}
            </FormErrorMessage>
          </FormControl>
          {getValues(`columns.${index}.columnType`) === BasicField.Dropdown && (
            <EditTableDropdown inputName={`columns.${index}.fieldOptions`} />
          )}
          <FormControl isReadOnly={isLoading}>
            <Toggle
              {...register(`columns.${index}.required`)}
              label="Required"
            />
          </FormControl>
        </Stack>
      ))}
      <Button
        variant="link"
        w="fit-content"
        leftIcon={<BiPlus fontSize="1.5rem" />}
        onClick={handleAddColumn}
        isDisabled={isLoading}
      >
        Add column
      </Button>
    </Stack>
  )
}

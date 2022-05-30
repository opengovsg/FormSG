import { useMemo } from 'react'
import { Control, Controller, FormState } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import { get } from 'lodash'

import { REQUIRED_ERROR } from '~constants/validation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { EditTableInputs } from './EditTable'
import { EditTableDropdownInput } from './EditTableDropdownInput'

interface EditTableDropdownProps {
  index: number
  control: Control<EditTableInputs>
  errors: FormState<EditTableInputs>['errors']
}

export const EditTableDropdown = ({
  index,
  control,
  errors,
}: EditTableDropdownProps): JSX.Element => {
  const inputName = useMemo(
    () => `columns.${index}.fieldOptions` as const,
    [index],
  )

  return (
    <FormControl isRequired isInvalid={get(errors, inputName)}>
      <FormLabel>Options</FormLabel>
      <Controller
        name={inputName}
        control={control}
        // Required so value exists (and does not crash the app) when column is swapped to Dropdown type.
        defaultValue={[]}
        rules={{
          required: REQUIRED_ERROR,
          validate: (value) => {
            return (
              new Set(value).size === value.length ||
              'Please remove duplicate options.'
            )
          },
        }}
        render={({ field }) => <EditTableDropdownInput {...field} />}
      />
      <FormErrorMessage>{get(errors, `${inputName}.message`)}</FormErrorMessage>
    </FormControl>
  )
}

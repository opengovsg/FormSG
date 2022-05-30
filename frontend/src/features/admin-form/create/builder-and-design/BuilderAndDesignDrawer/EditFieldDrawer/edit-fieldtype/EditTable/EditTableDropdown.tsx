import { Control, Controller, FormState } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'

import { REQUIRED_ERROR } from '~constants/validation'
import FormLabel from '~components/FormControl/FormLabel'
import Textarea from '~components/Textarea'

import { SPLIT_TEXTAREA_TRANSFORM } from '../common/constants'

import { EditTableInputs } from './EditTable'

interface EditTableDropdownProps {
  index: number
  control: Control<EditTableInputs>
  errors: FormState<EditTableInputs>['errors']
}

export const EditTableDropdown = ({
  index,
  control,
}: EditTableDropdownProps): JSX.Element => {
  return (
    <FormControl isRequired>
      <FormLabel>Options</FormLabel>
      <Controller
        name={`columns.${index}.fieldOptions`}
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
        render={({ field: { value, onChange, ...field } }) => (
          <Textarea
            value={SPLIT_TEXTAREA_TRANSFORM.input(value)}
            onChange={(e) => {
              return onChange(SPLIT_TEXTAREA_TRANSFORM.output(e.target.value))
            }}
            {...field}
          />
        )}
      />
    </FormControl>
  )
}

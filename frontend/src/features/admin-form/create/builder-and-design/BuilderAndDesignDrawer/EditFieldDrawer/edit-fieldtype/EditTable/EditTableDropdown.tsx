import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl } from '@chakra-ui/react'
import { get } from 'lodash'

import { REQUIRED_ERROR } from '~constants/validation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { EditTableInputs } from './EditTable'
import { EditTableDropdownInput } from './EditTableDropdownInput'

interface EditTableDropdownProps {
  inputName: `columns.${number}.fieldOptions`
}

export const EditTableDropdown = ({
  inputName,
}: EditTableDropdownProps): JSX.Element => {
  const { t } = useTranslation()
  const { control } = useFormContext<EditTableInputs>()
  const { errors } = useFormState<EditTableInputs>()

  return (
    <FormControl id={inputName} isRequired isInvalid={get(errors, inputName)}>
      <FormLabel>
        {t('features.adminForm.sidebar.fields.radio.options.title')}
      </FormLabel>
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
              t('features.adminForm.sidebar.fields.radio.duplicateOptionsError')
            )
          },
        }}
        render={({ field }) => <EditTableDropdownInput {...field} />}
      />
      <FormErrorMessage>{get(errors, `${inputName}.message`)}</FormErrorMessage>
    </FormControl>
  )
}

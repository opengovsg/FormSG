import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { forwardRef } from '@chakra-ui/react'

import { DropdownColumnBase } from '~shared/types'

import Textarea from '~components/Textarea'

import { SPLIT_TEXTAREA_TRANSFORM } from '../common/constants'

interface EditTableDropdownInputProps {
  value: DropdownColumnBase['fieldOptions']
  onChange: (value: DropdownColumnBase['fieldOptions']) => void
}

export const EditTableDropdownInput = forwardRef<
  EditTableDropdownInputProps,
  'input'
>(({ value, onChange }, ref) => {
  const { t } = useTranslation()
  const [_value, setInternalValue] = useState(
    SPLIT_TEXTAREA_TRANSFORM.input(value),
  )
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInternalValue(e.target.value)
      onChange(SPLIT_TEXTAREA_TRANSFORM.output(e.target.value))
    },
    [onChange],
  )

  return (
    <Textarea
      ref={ref}
      value={_value}
      onChange={handleInputChange}
      placeholder={t(
        'features.adminForm.sidebar.fields.radio.options.placeholder',
      )}
    />
  )
})

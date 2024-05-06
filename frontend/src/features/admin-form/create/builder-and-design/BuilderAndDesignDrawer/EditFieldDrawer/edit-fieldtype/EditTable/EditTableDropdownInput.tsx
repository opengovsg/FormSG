import { useCallback, useState } from 'react'
import { forwardRef } from '@chakra-ui/react'
import { Textarea } from '@opengovsg/design-system-react'

import { DropdownColumnBase } from '~shared/types'

import { SPLIT_TEXTAREA_TRANSFORM } from '../common/constants'

interface EditTableDropdownInputProps {
  value: DropdownColumnBase['fieldOptions']
  onChange: (value: DropdownColumnBase['fieldOptions']) => void
}

export const EditTableDropdownInput = forwardRef<
  EditTableDropdownInputProps,
  'input'
>(({ value, onChange }, ref) => {
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
      placeholder="Enter one option per line"
    />
  )
})

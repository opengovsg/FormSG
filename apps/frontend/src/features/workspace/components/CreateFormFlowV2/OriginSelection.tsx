import { useCallback } from 'react'
import { Box, Stack } from '@chakra-ui/react'

import Checkbox from '~components/Checkbox'
import Input from '~components/Input'

export type FormOriginValue =
  | 'paper'
  | 'new_process'
  | 'email'
  | 'documents'
  | 'spreadsheets'
  | 'other_builders'
  | 'other'

interface OriginOption {
  value: FormOriginValue
  label: string
}

const ORIGIN_OPTIONS: OriginOption[] = [
  { value: 'paper', label: 'Paper form' },
  { value: 'new_process', label: 'This is a new process' },
  { value: 'email', label: 'Emails' },
  { value: 'documents', label: 'Documents (e.g. PDF, Word)' },
  { value: 'spreadsheets', label: 'Spreadsheets (e.g. Excel, Sheets)' },
  { value: 'other_builders', label: 'Other form builders' },
  { value: 'other', label: 'Other' },
]

interface OriginSelectionProps {
  selected: FormOriginValue[]
  onSelectionChange: (selected: FormOriginValue[]) => void
  othersText: string
  onOthersTextChange: (text: string) => void
}

export const OriginSelection = ({
  selected,
  onSelectionChange,
  othersText,
  onOthersTextChange,
}: OriginSelectionProps): JSX.Element => {
  const handleToggle = useCallback(
    (value: FormOriginValue) => {
      if (value === 'new_process') {
        if (selected.includes('new_process')) {
          onSelectionChange([])
        } else {
          onSelectionChange(['new_process'])
          onOthersTextChange('')
        }
        return
      }

      const withoutNew = selected.filter((v) => v !== 'new_process')

      if (withoutNew.includes(value)) {
        const next = withoutNew.filter((v) => v !== value)
        onSelectionChange(next)
        if (value === 'other') {
          onOthersTextChange('')
        }
      } else {
        onSelectionChange([...withoutNew, value])
      }
    },
    [selected, onSelectionChange, onOthersTextChange],
  )

  return (
    <Stack spacing="0.25rem">
      {ORIGIN_OPTIONS.map((option) => {
        const isSelected = selected.includes(option.value)

        return (
          <Box key={option.value}>
            <Checkbox
              isChecked={isSelected}
              onChange={() => handleToggle(option.value)}
            >
              {option.label}
            </Checkbox>

            {option.value === 'other' && isSelected && (
              <Box mt="0.25rem" pl="2.5rem">
                <Input
                  placeholder="Please specify"
                  value={othersText}
                  onChange={(e) => onOthersTextChange(e.target.value)}
                  autoFocus
                />
              </Box>
            )}
          </Box>
        )
      })}
    </Stack>
  )
}

import { useCallback } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import Checkbox from '~components/Checkbox'
import Input from '~components/Input'

export type FormOriginValue =
  | 'paper'
  | 'pdf'
  | 'email'
  | 'word'
  | 'new'
  | 'others'

interface OriginOption {
  value: FormOriginValue
  label: string
  icon: string
}

const ORIGIN_OPTIONS: OriginOption[] = [
  { value: 'paper', label: 'Paper form', icon: '📄' },
  { value: 'pdf', label: 'PDF document', icon: '📋' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'word', label: 'Word document', icon: '📝' },
  { value: 'new', label: 'This is a new form', icon: '✨' },
  { value: 'others', label: 'Others', icon: '⋯' },
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
      if (value === 'new') {
        // "This is a new form" is mutually exclusive
        if (selected.includes('new')) {
          onSelectionChange([])
        } else {
          onSelectionChange(['new'])
          onOthersTextChange('')
        }
        return
      }

      // Selecting any other option deselects "new"
      const withoutNew = selected.filter((v) => v !== 'new')

      if (withoutNew.includes(value)) {
        const next = withoutNew.filter((v) => v !== value)
        onSelectionChange(next)
        if (value === 'others') {
          onOthersTextChange('')
        }
      } else {
        onSelectionChange([...withoutNew, value])
      }
    },
    [selected, onSelectionChange, onOthersTextChange],
  )

  return (
    <Stack spacing="0.5rem">
      {ORIGIN_OPTIONS.map((option) => {
        const isSelected = selected.includes(option.value)

        return (
          <Box key={option.value}>
            <Flex
              as="button"
              type="button"
              align="center"
              w="100%"
              p="0.875rem"
              border="2px solid"
              borderColor={isSelected ? '#445FCD' : 'neutral.300'}
              borderRadius="8px"
              bg={isSelected ? '#F0F2FB' : 'white'}
              cursor="pointer"
              transition="all 0.15s"
              _hover={{ bg: isSelected ? '#F0F2FB' : 'neutral.100' }}
              onClick={() => handleToggle(option.value)}
            >
              <Checkbox
                isChecked={isSelected}
                onChange={() => handleToggle(option.value)}
                pointerEvents="none"
              >
                <Flex align="center" gap="0.5rem">
                  <Text fontSize="1.125rem">{option.icon}</Text>
                  <Text textStyle="body-1" color="secondary.700">
                    {option.label}
                  </Text>
                </Flex>
              </Checkbox>
            </Flex>

            {option.value === 'others' && isSelected && (
              <Box mt="0.5rem" pl="3rem">
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

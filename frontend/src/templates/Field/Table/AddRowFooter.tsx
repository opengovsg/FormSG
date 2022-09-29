import { useMemo } from 'react'
import { BiPlus } from 'react-icons/bi'
import { Stack, Text, VisuallyHidden } from '@chakra-ui/react'
import simplur from 'simplur'

import Button from '~components/Button'

interface AddRowFooterProps {
  handleAddRow: () => void
  currentRows: number
  maxRows: number | ''
}

export const AddRowFooter = ({
  currentRows,
  maxRows,
  handleAddRow,
}: AddRowFooterProps): JSX.Element => {
  const maxRowDescription = useMemo(() => {
    return maxRows
      ? simplur`${currentRows} out of max ${maxRows} row[|s]`
      : simplur`${currentRows} row[|s]`
  }, [currentRows, maxRows])

  const maxRowAriaDescription = useMemo(() => {
    return maxRows
      ? simplur`There [is|are] currently ${currentRows} out of max ${maxRows} row[|s].`
      : simplur`There [is|are] currently ${currentRows} row[|s].`
  }, [currentRows, maxRows])

  return (
    <Stack
      mt="0.75rem"
      direction={{ base: 'column', lg: 'row' }}
      justify="space-between"
      align={{ base: 'start', lg: 'center' }}
      spacing="0.75rem"
    >
      <Button
        isDisabled={!!maxRows && currentRows >= maxRows}
        leftIcon={<BiPlus fontSize="1.5rem" />}
        type="button"
        onClick={handleAddRow}
      >
        Add another row
        <VisuallyHidden>
          to the table field. {maxRowAriaDescription}
        </VisuallyHidden>
      </Button>

      <Text textStyle="body-2" color="secondary.400">
        <VisuallyHidden>The table field currently has </VisuallyHidden>
        {maxRowDescription}
      </Text>
    </Stack>
  )
}

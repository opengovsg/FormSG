import { BiPlus } from 'react-icons/bi'
import { Stack, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import Button from '~components/Button'

interface AddRowFooterProps {
  handleAddRow: () => void
  currentRows: number
  maxRows: number
}

export const AddRowFooter = ({
  currentRows,
  maxRows,
  handleAddRow,
}: AddRowFooterProps): JSX.Element => {
  return (
    <Stack
      mt="0.75rem"
      direction={{ base: 'column', md: 'row' }}
      justify="space-between"
      align={{ base: 'start', md: 'center' }}
      spacing="0.75rem"
    >
      <Button
        isDisabled={currentRows >= maxRows}
        leftIcon={<BiPlus fontSize="1.5rem" />}
        type="button"
        onClick={handleAddRow}
      >
        Add another row
      </Button>

      <Text textStyle="body-2" color="secondary.400">
        {simplur`${currentRows} out of max ${maxRows} row[|s]`}
      </Text>
    </Stack>
  )
}

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
    <Stack direction="row" justify="space-between" align="center">
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

import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'
import { Box, Stack, Text, VisuallyHidden } from '@chakra-ui/react'

import Button from '~components/Button'

interface AddRowFooterProps {
  isDisabled?: boolean
  handleAddRow: () => void
  currentRows: number
  maxRows: number | ''
}

export const AddRowFooter = ({
  isDisabled,
  currentRows,
  maxRows,
  handleAddRow: handleAddRowProp,
}: AddRowFooterProps): JSX.Element => {
  const { t } = useTranslation()

  // State to decide whether to announce row changes to screen readers
  const [hasAddedRows, setHasAddedRows] = useState(false)
  const maxRowDescription = Number.isInteger(maxRows)
    ? t('features.publicForm.components.table.rowMax', {
        currentRows,
        count: Number(maxRows),
      })
    : t('features.publicForm.components.table.row', {
        count: currentRows,
      })

  const handleAddRow = useCallback(() => {
    handleAddRowProp()
    setHasAddedRows(true)
  }, [handleAddRowProp])

  return (
    <Stack
      mt="0.75rem"
      direction={{ base: 'column', lg: 'row' }}
      justify="space-between"
      align={{ base: 'start', lg: 'center' }}
      spacing="0.75rem"
    >
      <Button
        isDisabled={isDisabled || (!!maxRows && currentRows >= maxRows)}
        leftIcon={<BiPlus fontSize="1.5rem" />}
        type="button"
        onClick={handleAddRow}
      >
        {t('features.publicForm.components.table.addAnotherRow')}
        <VisuallyHidden>
          {t('features.publicForm.components.table.addAnotherRowAria')}
        </VisuallyHidden>
      </Button>

      <Box>
        <VisuallyHidden aria-live={hasAddedRows ? 'polite' : 'off'} aria-atomic>
          {t('features.publicForm.components.table.rowAria')}{' '}
          {maxRowDescription}
        </VisuallyHidden>

        <Text aria-hidden textStyle="body-2" color="secondary.400">
          {maxRowDescription}
        </Text>
      </Box>
    </Stack>
  )
}

import { useTranslation } from 'react-i18next'
import { BiTrash } from 'react-icons/bi'
import { Box, Flex, Stack } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import IconButton from '~components/IconButton'

export interface SaveActionGroupProps {
  handleCancel: () => void
  handleDelete?: () => void
  handleSubmit: () => void
  submitButtonLabel?: string
  isLoading: boolean
  ariaLabelName: string
  /**
   * Disables submit on its own, leaving cancel usable. For a card that is shown
   * read-only rather than hidden, so it can still be closed.
   */
  isSubmitDisabled?: boolean
}

export const SaveActionGroup = ({
  submitButtonLabel,
  handleCancel,
  handleDelete,
  handleSubmit,
  isLoading,
  ariaLabelName,
  isSubmitDisabled,
}: SaveActionGroupProps): JSX.Element => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  return (
    /* A row of three on a wide card, a column of three on a narrow one. The
    save pair goes full width below `md`, which leaves the delete button
    nowhere to sit on the same line, so the group turns down the page and
    delete takes the last row on its own. */
    <Flex
      justify="space-between"
      align={{ base: 'stretch', md: 'center' }}
      direction={{ base: 'column', md: 'row' }}
      gap={{ base: '0.5rem', md: '0' }}
      px={{ base: '1.5rem', md: '2rem' }}
    >
      {handleDelete ? (
        <IconButton
          /* Ordered last on mobile while staying first in the DOM, so the
          reading and focus order still reaches delete before the save pair
          on both layouts, and only the paint order differs. */
          order={{ base: 1, md: 0 }}
          alignSelf={{ base: 'center', md: 'auto' }}
          variant="clear"
          colorScheme="danger"
          aria-label={t('features.adminForm.sidebar.logic.aria.delete', {
            name: ariaLabelName,
          })}
          icon={<BiTrash />}
          onClick={handleDelete}
          isDisabled={isLoading}
        />
      ) : (
        <Box />
      )}
      <Stack
        spacing={{ base: '0.5rem', md: '1rem' }}
        direction={{ base: 'column', md: 'row-reverse' }}
        w="100%"
      >
        <Button
          isDisabled={isLoading || isSubmitDisabled}
          onClick={handleSubmit}
          isFullWidth={isMobile}
        >
          {submitButtonLabel ??
            t('features.adminForm.sidebar.logic.saveChangesBtn')}
        </Button>
        <Button
          variant="clear"
          colorScheme="secondary"
          isDisabled={isLoading}
          onClick={handleCancel}
          isFullWidth={isMobile}
        >
          {t('features.adminForm.sidebar.logic.cancelBtn')}
        </Button>
      </Stack>
    </Flex>
  )
}

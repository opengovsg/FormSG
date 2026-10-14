import { useTranslation } from 'react-i18next'
import { ButtonGroup, Divider } from '@chakra-ui/react'

import Button from '~components/Button'

/**
 * Footer shared by the toolbar menus that list columns as checkboxes.
 * Sits outside the menu's scrolling list so it stays put while the list scrolls.
 */
export const CheckAllFooter = ({
  onCheckAll,
  onUncheckAll,
}: {
  onCheckAll: () => void
  onUncheckAll: () => void
}): JSX.Element => {
  const { t } = useTranslation()
  const { checkAll, uncheckAll } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.toolbar',
    { returnObjects: true },
  )

  return (
    <>
      <Divider />
      <ButtonGroup px="1rem" py="0.75rem" spacing="0.5rem">
        <Button variant="clear" onClick={onCheckAll}>
          {checkAll}
        </Button>
        <Button variant="clear" onClick={onUncheckAll}>
          {uncheckAll}
        </Button>
      </ButtonGroup>
    </>
  )
}

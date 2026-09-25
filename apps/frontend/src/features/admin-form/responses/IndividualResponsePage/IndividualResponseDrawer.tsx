import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from '@chakra-ui/react'

import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'

import { IndividualResponsePage } from './IndividualResponsePage'

export const IndividualResponseDrawer = (): JSX.Element => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const navigate = useNavigate()

  const onClose = useCallback(
    () =>
      navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}`),
    [formId, navigate],
  )

  return (
    <Drawer isOpen placement="right" size="lg" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderBottomColor="neutral.300">
          {t('features.common.responses')}
        </DrawerHeader>
        <DrawerBody px={0} py="1.5rem">
          <IndividualResponsePage inDrawer />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

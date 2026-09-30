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
  HStack,
  Text,
} from '@chakra-ui/react'

import { ADMINFORM_RESULTS_SUBROUTE, ADMINFORM_ROUTE } from '~constants/routes'
import Button from '~components/Button'

import { useOptionalPrototypeStore } from '../prototype/context'

import { IndividualResponsePage } from './IndividualResponsePage'

export const IndividualResponseDrawer = (): JSX.Element => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const navigate = useNavigate()
  const prototypeStore = useOptionalPrototypeStore()

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
          <HStack spacing="1rem" pr="2rem" flexWrap="wrap">
            <Text>{t('features.common.responses')}</Text>
            {prototypeStore && (
              <Button variant="link" size="sm" onClick={prototypeStore.reset}>
                Reset demo
              </Button>
            )}
          </HStack>
        </DrawerHeader>
        <DrawerBody px={0} py="1.5rem">
          <IndividualResponsePage inDrawer />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

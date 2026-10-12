import { RefObject, useCallback, useEffect, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Box } from '@chakra-ui/react'

import { PeekCard } from '~features/admin-form/create/workflow/components/GuidedCreation'

import {
  isConvertedIdentityArrival,
  useClearConvertedIdentityArrival,
} from '../../useFocusConvertedIdentityField'

/** Tucked under the first converted field, like the MRF guide's peek cards. */
export const ConvertedIdentityPeekCard = ({
  isCorppass,
  fieldRef,
}: {
  isCorppass: boolean
  fieldRef: RefObject<HTMLDivElement>
}) => {
  const location = useLocation()
  const clearArrival = useClearConvertedIdentityArrival()
  const isOpen = isConvertedIdentityArrival(location.state)
  const descriptionId = useId()
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.loginIdentity',
  })

  const onClose = useCallback(() => {
    fieldRef.current?.focus({ preventScroll: true })
    clearArrival()
  }, [clearArrival, fieldRef])

  useEffect(() => {
    const field = fieldRef.current
    if (!isOpen || !field) return
    const previousDescription = field.getAttribute('aria-describedby')
    field.setAttribute('aria-describedby', descriptionId)
    field.focus({ preventScroll: true })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    field.addEventListener('keydown', onKeyDown)
    return () => {
      field.removeEventListener('keydown', onKeyDown)
      if (previousDescription)
        field.setAttribute('aria-describedby', previousDescription)
      else field.removeAttribute('aria-describedby')
    }
  }, [isOpen, fieldRef, descriptionId, onClose])

  if (!isOpen) return null

  return (
    <Box id={descriptionId} mx="2px">
      <PeekCard
        title={
          isCorppass ? t('convertedCorppassTitle') : t('convertedMyInfoTitle')
        }
        actions={[{ label: t('gotIt'), onClick: onClose }]}
      />
    </Box>
  )
}

import { useTranslation } from 'react-i18next'
import {
  ButtonGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types/form'
import { getLoginIdentityAttrsForAuthType } from 'formsg-shared/utils/login-identity'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { useMutateFormSettings } from '../../mutations'

import { ConversionPreview } from './ConversionPreview'

interface Props {
  authType: FormAuthType
  isOpen: boolean
  onClose: () => void
  nextQuestionNumber?: number
}
export const SubmitterIdConversionModal = ({
  authType,
  isOpen,
  onClose,
  nextQuestionNumber,
}: Props) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })
  const { t: tCommon } = useTranslation()
  const { mutateConvertSubmitterIdCollection } = useMutateFormSettings()
  const isSaving = mutateConvertSubmitterIdCollection.isLoading
  const handleClose = () => {
    if (!isSaving) onClose()
  }
  const attrs = getLoginIdentityAttrsForAuthType(authType)
  const login = authType === FormAuthType.CP ? 'corppass' : 'singpass'
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnEsc={!isSaving}
      closeOnOverlayClick={!isSaving}
      returnFocusOnClose={false}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent
        h={{
          base: 'calc(100dvh - 2rem)',
          md: 'min(52rem, calc(100dvh - 8rem))',
        }}
        maxH="none"
        my={{ base: '1rem', md: '4rem' }}
      >
        <ModalCloseButton isDisabled={isSaving} />
        <ModalHeader flexShrink={0}>{t(`${login}.modalTitle`)}</ModalHeader>
        <ModalBody
          display="flex"
          flexDirection="column"
          flex={1}
          minH={0}
          overflow="hidden"
        >
          <ConversionPreview
            attrs={attrs}
            nextQuestionNumber={nextQuestionNumber}
          />
        </ModalBody>
        <ModalFooter
          flexShrink={0}
          borderTopWidth="1px"
          borderTopColor="neutral.300"
        >
          <ButtonGroup>
            <Button
              variant="clear"
              colorScheme="secondary"
              onClick={handleClose}
              isDisabled={isSaving}
            >
              {tCommon('features.common.cancel')}
            </Button>
            <Button
              isLoading={isSaving}
              onClick={() => {
                if (isSaving) return
                mutateConvertSubmitterIdCollection.mutate(undefined, {
                  onSuccess: onClose,
                })
              }}
            >
              {t('makeTheSwitch')}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

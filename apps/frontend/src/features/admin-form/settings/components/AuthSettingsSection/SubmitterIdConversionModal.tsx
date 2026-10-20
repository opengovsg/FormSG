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
  const attrs = getLoginIdentityAttrsForAuthType(authType)
  const login = authType === FormAuthType.CP ? 'corppass' : 'singpass'
  return (
    <Modal isOpen={isOpen} onClose={onClose} returnFocusOnClose={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>{t(`${login}.modalTitle`)}</ModalHeader>
        <ModalBody>
          <ConversionPreview
            attrs={attrs}
            nextQuestionNumber={nextQuestionNumber}
          />
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              {tCommon('features.common.cancel')}
            </Button>
            <Button
              isLoading={mutateConvertSubmitterIdCollection.isLoading}
              onClick={() =>
                mutateConvertSubmitterIdCollection.mutate(undefined, {
                  onSuccess: onClose,
                })
              }
            >
              {t('makeTheSwitch')}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

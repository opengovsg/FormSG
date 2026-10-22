import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useMediaQuery,
} from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types/form'
import { getLoginIdentityAttrsForAuthType } from 'formsg-shared/utils/login-identity'

import { NextAndBackButtonGroup } from '~components/Button'
import { ModalCloseButton } from '~components/Modal'
import { ProgressIndicator } from '~components/ProgressIndicator/ProgressIndicator'

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
  const [stepNumber, setStepNumber] = useState(0)
  useEffect(() => {
    if (isOpen) setStepNumber(0)
  }, [isOpen])
  const isSaving = mutateConvertSubmitterIdCollection.isLoading
  const handleClose = () => {
    if (!isSaving) onClose()
  }
  const [usePageScroll] = useMediaQuery(
    '(max-height: 640px), (max-width: 479px)',
  )
  const attrs = getLoginIdentityAttrsForAuthType(authType)
  const login = authType === FormAuthType.CP ? 'corppass' : 'singpass'
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnEsc={!isSaving}
      closeOnOverlayClick={!isSaving}
      returnFocusOnClose={false}
      scrollBehavior={usePageScroll ? 'outside' : 'inside'}
    >
      <ModalOverlay />
      <ModalContent
        h="auto"
        maxH={
          usePageScroll
            ? 'none'
            : {
                base: 'calc(100dvh - 2rem)',
                md: 'calc(100dvh - 8rem)',
              }
        }
        my={{ base: '1rem', md: '4rem' }}
      >
        <ModalCloseButton isDisabled={isSaving} />
        <ModalHeader flexShrink={0}>
          <Text mb="0.25rem">
            {t(
              stepNumber === 0 ? `${login}.modalTitle` : 'preview.outputTitle',
            )}
          </Text>
          <ProgressIndicator
            numIndicators={2}
            currActiveIdx={stepNumber}
            onClick={isSaving ? undefined : setStepNumber}
          />
        </ModalHeader>
        <ModalBody
          display="flex"
          flexDirection="column"
          flex="0 1 auto"
          minH={0}
          overflow={usePageScroll ? 'visible' : 'hidden'}
        >
          <ConversionPreview
            key={stepNumber}
            stepNumber={stepNumber}
            attrs={attrs}
            isScrollable={!usePageScroll}
            nextQuestionNumber={nextQuestionNumber}
          />
        </ModalBody>
        <ModalFooter flexShrink={0}>
          <NextAndBackButtonGroup
            backButtonLabel={tCommon(
              stepNumber === 0
                ? 'features.common.cancel'
                : 'features.common.back',
            )}
            nextButtonLabel={
              stepNumber === 0
                ? tCommon('features.common.next')
                : t('makeTheSwitch')
            }
            isBackDisabled={isSaving}
            isNextDisabled={isSaving}
            isNextLoading={isSaving}
            handleBack={() => {
              if (isSaving) return
              if (stepNumber === 0) handleClose()
              else setStepNumber(0)
            }}
            handleNext={() => {
              if (isSaving) return
              if (stepNumber === 0) {
                setStepNumber(1)
                return
              }
              mutateConvertSubmitterIdCollection.mutate(undefined, {
                onSuccess: onClose,
              })
            }}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

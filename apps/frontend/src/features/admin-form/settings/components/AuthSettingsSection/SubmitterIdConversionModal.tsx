import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
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

import { useIsMobile } from '~hooks/useIsMobile'
import Button, { NextAndBackButtonGroup } from '~components/Button'
import { ModalCloseButton } from '~components/Modal'
import { ProgressIndicator } from '~components/ProgressIndicator/ProgressIndicator'

import { useMutateFormSettings } from '../../mutations'

import {
  ConversionFieldPreview,
  ConversionResponseChanges,
} from './ConversionPreview'

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
  const [didConvert, setDidConvert] = useState(false)
  const firstHeadingRef = useRef<HTMLHeadingElement>(null)
  const secondHeadingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (isOpen) {
      setStepNumber(0)
      setDidConvert(false)
    }
  }, [isOpen])
  useEffect(() => {
    if (isOpen) {
      const heading = stepNumber === 0 ? firstHeadingRef : secondHeadingRef
      heading.current?.focus()
    }
  }, [isOpen, stepNumber])
  const isMobile = useIsMobile()
  const isSaving = mutateConvertSubmitterIdCollection.isLoading
  const handleClose = () => {
    if (!isSaving) onClose()
  }
  const [isCompactViewport] = useMediaQuery('(max-height: 640px)')
  const login = authType === FormAuthType.CP ? 'corppass' : 'singpass'
  const backButtonLabel = tCommon(
    stepNumber === 0 ? 'features.common.cancel' : 'features.common.back',
  )
  const nextButtonLabel =
    stepNumber === 0 ? tCommon('features.common.next') : t('makeTheSwitch')
  const handleBack = () => {
    if (isSaving) return
    if (stepNumber === 0) handleClose()
    else setStepNumber(0)
  }
  const handleNext = () => {
    if (isSaving) return
    if (stepNumber === 0) {
      setStepNumber(1)
      return
    }
    mutateConvertSubmitterIdCollection.mutate(undefined, {
      onSuccess: () => {
        setDidConvert(true)
        onClose()
      },
    })
  }
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnEsc={!isSaving}
      closeOnOverlayClick={!isSaving}
      initialFocusRef={firstHeadingRef}
      returnFocusOnClose={!isSaving && !didConvert}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent
        h={{ base: '100dvh', md: 'auto' }}
        maxH={{
          base: '100dvh',
          md: isCompactViewport ? 'calc(100dvh - 2rem)' : 'calc(100dvh - 8rem)',
        }}
        maxW={{ base: '100vw', md: '42.5rem' }}
        my={{ base: 0, md: isCompactViewport ? '1rem' : '4rem' }}
        borderRadius={{ base: 0, md: '4px' }}
      >
        <ModalCloseButton
          isDisabled={isSaving}
          top={{ base: '0.75rem', md: '2rem' }}
          right={{ base: '1rem', md: '2rem' }}
        />
        <ModalHeader srOnly>
          {t(stepNumber === 0 ? `${login}.modalTitle` : `${login}.outputTitle`)}
        </ModalHeader>
        <Box
          pt={{ base: '1rem', md: '2rem' }}
          px={{ base: '1rem', md: '2rem' }}
          textStyle="h2"
          flexShrink={0}
        >
          <ProgressIndicator
            numIndicators={2}
            currActiveIdx={stepNumber}
            onClick={isSaving ? undefined : setStepNumber}
          />
        </Box>
        <ModalBody
          display="grid"
          gridTemplateRows="minmax(0, 1fr)"
          flex={{ base: 1, md: '0 1 auto' }}
          minH={0}
          overflow="hidden"
          px={{ base: '1rem', md: '2rem' }}
        >
          {/* Both panels contribute their natural height to the same grid cell.
              Only the active panel is visible and available to assistive tech. */}
          {[0, 1].map((panelStep) => (
            <Box
              key={panelStep}
              gridArea="1 / 1"
              minH={0}
              overflowY="auto"
              visibility={panelStep === stepNumber ? 'visible' : 'hidden'}
              aria-hidden={panelStep !== stepNumber}
              {...(panelStep !== stepNumber ? { inert: '' } : {})}
              sx={{ scrollbarGutter: 'stable' }}
            >
              <Text
                as="h2"
                ref={panelStep === 0 ? firstHeadingRef : secondHeadingRef}
                tabIndex={-1}
                _focus={{ outline: 'none' }}
                textStyle={{ base: 'h3', md: 'h2' }}
                mt="0.75rem"
                mb={{ base: '0.75rem', md: '1rem' }}
              >
                {t(
                  panelStep === 0
                    ? `${login}.modalTitle`
                    : `${login}.outputTitle`,
                )}
              </Text>
              {panelStep === 0 ? (
                <ConversionFieldPreview
                  authType={authType}
                  nextQuestionNumber={nextQuestionNumber}
                />
              ) : (
                <ConversionResponseChanges />
              )}
            </Box>
          ))}
        </ModalBody>
        <ModalFooter
          onClickCapture={(event) => {
            // The second click of a double-click belongs to Next, not confirmation.
            if (stepNumber === 1 && event.detail > 1) {
              event.preventDefault()
              event.stopPropagation()
              secondHeadingRef.current?.focus()
            }
          }}
          flexShrink={0}
          justifyContent="flex-end"
          flexDirection={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'stretch', md: 'center' }}
          gap="1rem"
          px={{ base: '1rem', md: '2rem' }}
          py={{ base: '1rem', md: '2rem' }}
        >
          {isMobile ? (
            <Flex key={stepNumber} justifyContent="space-between" gap="1rem">
              <Button
                variant="clear"
                colorScheme="secondary"
                textStyle="subhead-2"
                isDisabled={isSaving}
                onClick={handleBack}
              >
                {backButtonLabel}
              </Button>
              <Button
                textStyle="subhead-2"
                isDisabled={isSaving}
                isLoading={isSaving}
                onClick={handleNext}
              >
                {nextButtonLabel}
              </Button>
            </Flex>
          ) : (
            <Box key={stepNumber}>
              <NextAndBackButtonGroup
                backButtonLabel={backButtonLabel}
                nextButtonLabel={nextButtonLabel}
                isBackDisabled={isSaving}
                isNextDisabled={isSaving}
                isNextLoading={isSaving}
                handleBack={handleBack}
                handleNext={handleNext}
              />
            </Box>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

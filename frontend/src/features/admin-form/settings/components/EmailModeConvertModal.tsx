import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiMailSend, BiRightArrowAlt } from 'react-icons/bi'
import { useMutation, useQueryClient } from 'react-query'
import {
  Box,
  ButtonGroup,
  Code,
  Container,
  Icon,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  Stack,
  Text,
  UnorderedList,
  useBreakpointValue,
  useClipboard,
  UseDisclosureReturn,
} from '@chakra-ui/react'
import dedent from 'dedent'
import FileSaver from 'file-saver'

import { BxsCheckCircle } from '~assets/icons/BxsCheckCircle'
import formsgSdk from '~utils/formSdk'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { convertEmailToStorageMode } from '~features/admin-form/email-migration/EmailToStorageMigrationService'
import { trackClickSecretKeyMailToEmailToStorageConvertedForm } from '~features/analytics/AnalyticsService'
import { CreateFormWizardInputProps } from '~features/workspace/components/CreateFormModal/CreateFormWizardContext'

import { useToast } from '../../../../hooks/useToast'
import { adminFormSettingsKeys } from '../queries'

type SaveSecretKeyScreenInputProps = Pick<
  CreateFormWizardInputProps,
  'storageAck'
>

const useSecretKeyDownload = ({
  secretKey,
  formTitle,
  formId,
  onClose,
}: {
  secretKey: string
  formTitle: string
  formId: string
  onClose: () => void
}) => {
  const { t } = useTranslation()

  const {
    register,
    formState: { isValid },
  } = useForm<SaveSecretKeyScreenInputProps>({
    defaultValues: {
      storageAck: false,
    },
  })

  const mailToHref = useMemo(() => {
    const subject = t(
      'features.workspace.modals.create.secretKey.email.subject',
      { titleInputValue: formTitle },
    )
    const body = dedent(
      t('features.workspace.modals.create.secretKey.email.body', {
        titleInputValue: formTitle,
        secretKey,
      }),
    )
    const href = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`
    return href
  }, [secretKey, formTitle, t])

  const [hasDownloaded, setHasDownloaded] = useState(false)
  const handleDownloadKey = useCallback(() => {
    FileSaver.saveAs(
      new Blob([secretKey], { type: 'text/plain;charset=utf-8' }),
      t('features.workspace.modals.create.secretKey.email.filename', {
        titleInputValue: formTitle,
        formId,
      }),
    )
    setHasDownloaded(true)
  }, [t, secretKey, formTitle, formId])

  const { hasCopied: hasCopiedKey, onCopy: onCopyKey } = useClipboard(secretKey)
  const handleCopyKey = useCallback(
    (e?: SyntheticEvent) => {
      e?.preventDefault()
      e?.stopPropagation()
      onCopyKey()
    },
    [onCopyKey],
  )

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasDownloaded) {
        e.preventDefault() // if event doesn't get explicitly handled, default action WILL not be taken
        // returnValue is deprecated, but we return it regardless to support legacy cases (e.g. Chrome/Edge < 119)
        e.returnValue = 'You have not downloaded your Secret Key yet'
      }
    }
    const handlePopState = (e: PopStateEvent) => {
      if (!hasDownloaded) {
        window.history.pushState(null, '', window.location.href)
        const confirmMessage =
          "You have not downloaded your Secret Key yet. You won't be able to access your form responses without it. Are you sure you want to leave?"
        if (window.confirm(confirmMessage)) {
          onClose()
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    window.history.pushState(null, '', window.location.href)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasDownloaded, onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !hasDownloaded) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [hasDownloaded])

  return {
    isSubmitEnabled: isValid && hasDownloaded,
    hasCopiedKey,
    handleCopyKey,
    onCopyKey,
    hasDownloaded,
    handleDownloadKey,
    mailToHref,
    register,
  }
}

export interface EmailModeConvertModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  formTitle: string
  formId: string
}

export const EmailModeConvertModal = ({
  onClose,
  isOpen,
  formTitle,
  formId,
}: EmailModeConvertModalProps): JSX.Element => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  const { publicKey, secretKey } = useMemo(
    () => formsgSdk.crypto.generate(),
    [],
  )

  const {
    isSubmitEnabled,
    hasCopiedKey,
    handleCopyKey,
    hasDownloaded,
    handleDownloadKey,
    mailToHref,
    register,
  } = useSecretKeyDownload({
    secretKey,
    formTitle,
    formId,
    onClose,
  })

  const toast = useToast()

  const convertEmailToStorageModeMutation = useMutation(
    convertEmailToStorageMode,
    {
      onSuccess: () => {
        toast.closeAll()
        toast({
          description: t(
            'features.adminForm.toasts.emailModeMigration.success',
          ),
          status: 'success',
          isClosable: true,
        })
        queryClient.invalidateQueries(adminFormKeys.id(formId))
        queryClient.invalidateQueries(adminFormSettingsKeys.id(formId))
        onClose()
      },
      onError: () => {
        toast.closeAll()
        toast({
          description: t('features.adminForm.toasts.emailModeMigration.error'),
          status: 'error',
          isClosable: true,
        })
      },
    },
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalBody whiteSpace="pre-wrap">
          <Container maxW="42.5rem" p={0}>
            <Box
              bg="white"
              borderRadius="4px"
              border="1px solid"
              borderColor="neutral.200"
              py="3rem"
              px={{ base: '1.5rem', md: '2.5rem' }}
              mt={{ base: '5.5rem', md: '1rem' }}
            >
              <Stack direction="column" spacing="1rem" mb="1rem">
                <Icon
                  as={BxsCheckCircle}
                  fontSize="3rem"
                  aria-hidden
                  color="primary.500"
                />
                <Text as="header" textStyle="h2" color="secondary.700">
                  {t('features.adminForm.modals.emailModeMigration.title')}
                </Text>
              </Stack>
              <UnorderedList mb="2.5rem" styleType="disc" spacing={2}>
                <ListItem>
                  <Text textStyle="body-1" color="secondary.500">
                    {t(
                      'features.workspace.modals.create.secretKey.message.preamble1',
                    )}
                  </Text>
                </ListItem>
                <ListItem>
                  <Text textStyle="body-1" color="secondary.500">
                    {t(
                      'features.workspace.modals.create.secretKey.message.preamble2.prefix',
                    )}
                    <Text color="danger.500" textStyle="subhead-1" as="span">
                      {t(
                        'features.workspace.modals.create.secretKey.message.preamble2.warning',
                      )}
                    </Text>
                  </Text>
                </ListItem>
              </UnorderedList>
              <Stack direction={{ base: 'column', md: 'row' }}>
                <Tooltip
                  mt={0}
                  label={t(
                    `features.workspace.modals.create.secretKey.tooltip.${hasCopiedKey ? 'copied' : 'copyKey'}`,
                  )}
                >
                  <Code
                    // To allow for focus styling on code element.
                    data-group
                    tabIndex={0}
                    flex={1}
                    transition="background 0.2s ease"
                    cursor="pointer"
                    onClick={handleCopyKey}
                    _groupFocus={{
                      bg: 'neutral.400',
                    }}
                    _hover={{
                      bg: 'neutral.300',
                    }}
                    wordBreak="break-word"
                    display="inline-flex"
                    alignItems="center"
                    w="100%"
                    h="auto"
                    px="0.75rem"
                    py="0.625rem"
                    bg="neutral.200"
                    color="secondary.500"
                    borderRadius="4px"
                  >
                    {secretKey}
                  </Code>
                </Tooltip>
                <ButtonGroup>
                  <Button onClick={handleDownloadKey}>
                    {t('features.workspace.modals.create.secretKey.download')}
                  </Button>
                  <IconButton
                    as="a"
                    icon={<BiMailSend />}
                    aria-label="Email the secret key to someone"
                    href={mailToHref}
                    onClick={() =>
                      trackClickSecretKeyMailToEmailToStorageConvertedForm(
                        formId,
                      )
                    }
                    variant="outline"
                  />
                </ButtonGroup>
              </Stack>
            </Box>
            {hasDownloaded && (
              <Box mt="1rem">
                <Checkbox
                  aria-label="Storage mode form acknowledgement"
                  {...register('storageAck', {
                    required: true,
                  })}
                >
                  {t('features.workspace.modals.create.secretKey.declaration')}
                </Checkbox>
              </Box>
            )}
            <Button
              mt="2.25rem"
              isDisabled={!isSubmitEnabled}
              rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              type="submit"
              isLoading={convertEmailToStorageModeMutation.isLoading}
              onClick={() =>
                convertEmailToStorageModeMutation.mutate({ formId, publicKey })
              }
              isFullWidth
            >
              <Text lineHeight="1.5rem">
                {t('features.workspace.modals.create.secretKey.confirm')}
              </Text>
            </Button>
          </Container>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

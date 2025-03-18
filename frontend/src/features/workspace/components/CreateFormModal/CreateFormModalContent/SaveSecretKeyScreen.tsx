import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiMailSend, BiRightArrowAlt } from 'react-icons/bi'
import { useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  ButtonGroup,
  Code,
  Container,
  Icon,
  Link,
  ModalBody,
  Stack,
  Text,
  useClipboard,
} from '@chakra-ui/react'
import dedent from 'dedent'
import FileSaver from 'file-saver'

import { BxsError } from '~assets/icons'
import { ADMINFORM_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { trackClickSecretKeyMailTo } from '~features/analytics/AnalyticsService'
import { workspaceKeys } from '~features/workspace/queries'

import { useCreateFormWizard } from '../CreateFormWizardContext'

/** Default hook to be used in SaveSecretKeyScreen */
const useSaveSecretKeyDefault = () => {
  const { t } = useTranslation()
  const {
    formMethods: {
      control,
      register,
      formState: { isValid },
    },
    isLoading,
    keypair: { secretKey },
  } = useCreateFormWizard()

  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const formId = queryClient.getQueryData(workspaceKeys.lastCreatedForm)

  const handleDownloadAndNavigate = useCallback(() => {
    if (formId) {
      queryClient.invalidateQueries(workspaceKeys.lastCreatedForm)
      navigate(`${ADMINFORM_ROUTE}/${formId}`)
    }
  }, [queryClient, navigate, formId])

  const [hasDownloaded, setHasDownloaded] = useState(false)

  const { hasCopied, onCopy } = useClipboard(secretKey)

  const titleInputValue = useWatch({ control, name: 'title' })

  trackClickSecretKeyMailTo(titleInputValue)
  const mailToHref = useMemo(() => {
    const subject = t(
      'features.workspace.modals.create.secretKey.email.subject',
      { titleInputValue },
    )
    const body = dedent(
      t('features.workspace.modals.create.secretKey.email.body', {
        titleInputValue,
        secretKey,
      }),
    )

    const href = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`
    return href
  }, [secretKey, titleInputValue, t])

  const handleDownloadKey = useCallback(() => {
    FileSaver.saveAs(
      new Blob([secretKey], { type: 'text/plain;charset=utf-8' }),
      t('features.workspace.modals.create.secretKey.email.filename', {
        titleInputValue,
        formId,
      }),
    )
    setHasDownloaded(true)
  }, [t, secretKey, titleInputValue, formId])

  const handleCopyKey = useCallback(
    (e?: SyntheticEvent) => {
      e?.preventDefault()
      e?.stopPropagation()
      onCopy()
    },
    [onCopy],
  )

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasDownloaded) {
        e.preventDefault() // if event doesn't get explicitly handled, default action WILL not be taken
        // returnValue is deprecated, but we return it regardless to support legacy cases (e.g. Chrome/Edge < 119)
        e.returnValue = 'You have not downloaded your Secret Key yet'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasDownloaded])

  return {
    isLoading,
    hasDownloaded,
    isSubmitEnabled: isValid && hasDownloaded,
    hasCopiedKey: hasCopied,
    handleCopyKey,
    handleDownloadKey,
    mailToHref,
    handleDownloadAndNavigate,
    secretKey,
    register,
  }
}

interface SaveSecretKeyScreenProps {
  useSaveSecretKey?: typeof useSaveSecretKeyDefault
}

export const SaveSecretKeyScreen = ({
  useSaveSecretKey = useSaveSecretKeyDefault,
}: SaveSecretKeyScreenProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    isLoading,
    handleCopyKey,
    handleDownloadAndNavigate,
    handleDownloadKey,
    mailToHref,
    hasDownloaded,
    isSubmitEnabled,
    hasCopiedKey,
    secretKey,
    register,
  } = useSaveSecretKey()

  return (
    <>
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
                as={BxsError}
                fontSize="3rem"
                aria-hidden
                color="danger.500"
              />
              <Text as="header" textStyle="h2" color="secondary.700">
                {t('features.workspace.modals.create.secretKey.title')}
              </Text>
            </Stack>
            <Text textStyle="body-1" color="secondary.500" mb="2.5rem">
              {t('features.workspace.modals.create.secretKey.message.preamble')}{' '}
              <Text color="danger.500" textStyle="subhead-1" as="span">
                {t(
                  'features.workspace.modals.create.secretKey.message.warning',
                )}
              </Text>
              .{' '}
              {t(
                'features.workspace.modals.create.secretKey.message.email.prefix',
              )}{' '}
              <Link variant="inline" href={mailToHref}>
                {t(
                  'features.workspace.modals.create.secretKey.message.email.link',
                )}
              </Link>{' '}
              {t(
                'features.workspace.modals.create.secretKey.message.email.suffix',
              )}
            </Text>
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
            isLoading={isLoading}
            onClick={handleDownloadAndNavigate}
            isFullWidth
          >
            <Text lineHeight="1.5rem">
              {t('features.workspace.modals.create.secretKey.confirm')}
            </Text>
          </Button>
        </Container>
      </ModalBody>
    </>
  )
}

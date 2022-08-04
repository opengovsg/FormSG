import { MouseEvent, useCallback, useMemo, useState } from 'react'
import { useWatch } from 'react-hook-form'
import {
  BiCheck,
  BiCopy,
  BiDownload,
  BiMailSend,
  BiRightArrowAlt,
} from 'react-icons/bi'
import {
  Box,
  Container,
  Icon,
  InputGroup,
  InputRightElement,
  ModalBody,
  ModalHeader,
  Stack,
  Text,
  useClipboard,
} from '@chakra-ui/react'
import dedent from 'dedent'
import FileSaver from 'file-saver'

import { BxsError } from '~assets/icons'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

import { useCreateFormWizard } from '../CreateFormWizardContext'

/** Default hook to be used in SaveSecretKeyScreen */
const useSaveSecretKeyDefault = () => {
  const {
    formMethods: {
      control,
      register,
      formState: { isValid },
    },
    handleCreateStorageModeForm,
    isLoading,
    keypair: { secretKey },
  } = useCreateFormWizard()

  const [hasActioned, setHasActioned] = useState(false)

  const { hasCopied, onCopy } = useClipboard(secretKey)

  const titleInputValue = useWatch({ control, name: 'title' })

  const mailToHref = useMemo(() => {
    const subject = `Shared Secret Key for ${titleInputValue}`
    const body = dedent`
        Dear collaborator,

        I am sharing my form's secret key with you for safekeeping and backup. This is an important key that is needed to access all form responses.

        Form title: ${titleInputValue}

        Secret key: ${secretKey}

        All you need to do is keep this email as a record, and please do not share this key with anyone else.

        Thank you for helping to safekeep my form!`

    const href = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`
    return href
  }, [secretKey, titleInputValue])

  const handleDownloadKey = useCallback(() => {
    FileSaver.saveAs(
      new Blob([secretKey], { type: 'text/plain;charset=utf-8' }),
      `Form Secret Key - ${titleInputValue}.txt`,
    )
    setHasActioned(true)
  }, [secretKey, titleInputValue])

  const handleEmailKey = useCallback(
    (e: MouseEvent) => {
      window.location.href = mailToHref

      setHasActioned(true)
      e.preventDefault()
    },
    [mailToHref],
  )

  const handleCopyKey = useCallback(() => {
    onCopy()
    setHasActioned(true)
  }, [onCopy])

  return {
    isLoading,
    hasActioned,
    isSubmitEnabled: isValid && hasActioned,
    hasCopiedKey: hasCopied,
    handleCopyKey,
    handleDownloadKey,
    handleEmailKey,
    handleCreateStorageModeForm,
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
  const {
    isLoading,
    handleCopyKey,
    handleCreateStorageModeForm,
    handleDownloadKey,
    handleEmailKey,
    isSubmitEnabled,
    hasActioned,
    hasCopiedKey,
    secretKey,
    register,
  } = useSaveSecretKey()

  const isMobile = useIsMobile()

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="42.5rem" p={0}>
          <Stack direction="column" spacing="1rem">
            <Icon
              as={BxsError}
              fontSize="3rem"
              aria-hidden
              color="danger.500"
            />
            <Text>Download Secret Key to proceed</Text>
          </Stack>
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-line">
        <Container maxW="42.5rem" p={0}>
          <Text textStyle="body-1" color="secondary.500" mb="2.5rem">
            You'll need it every time you access your responses to this form. If
            you lose it,{' '}
            <Text color="danger.500" textStyle="subhead-1" as="span">
              all responses will be permanently lost
            </Text>
            . You can also email it for safekeeping.
          </Text>
          <Stack direction={{ base: 'column', md: 'row' }}>
            <InputGroup>
              <Input isReadOnly value={secretKey} />
              <InputRightElement>
                <IconButton
                  variant="clear"
                  minH="2.5rem"
                  minW="2.5rem"
                  icon={hasCopiedKey ? <BiCheck /> : <BiCopy />}
                  onClick={handleCopyKey}
                  aria-label="Copy secret key"
                />
              </InputRightElement>
            </InputGroup>
            <Button
              leftIcon={
                isMobile ? <BiDownload fontSize="1.25rem" /> : undefined
              }
              onClick={handleDownloadKey}
            >
              Download key
            </Button>
            {isMobile ? (
              <Button
                onClick={handleEmailKey}
                aria-label="Email the secret key to someone"
                leftIcon={<BiMailSend fontSize="1.25rem" />}
                variant="outline"
              >
                Email key
              </Button>
            ) : (
              <IconButton
                onClick={handleEmailKey}
                icon={<BiMailSend />}
                aria-label="Email the secret key to someone"
                variant="outline"
              />
            )}
          </Stack>
          {hasActioned && (
            <Box mt="4rem">
              <Checkbox
                aria-label="Storage mode form acknowledgement"
                {...register('storageAck', {
                  required: true,
                })}
              >
                If I lose my Secret Key, I cannot activate my form or access any
                responses to it
              </Checkbox>
            </Box>
          )}
          <Button
            mt="2.25rem"
            isDisabled={!isSubmitEnabled}
            rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
            type="submit"
            isLoading={isLoading}
            onClick={handleCreateStorageModeForm}
            isFullWidth
          >
            <Text lineHeight="1.5rem">I have saved my Secret Key safely</Text>
          </Button>
        </Container>
      </ModalBody>
    </>
  )
}

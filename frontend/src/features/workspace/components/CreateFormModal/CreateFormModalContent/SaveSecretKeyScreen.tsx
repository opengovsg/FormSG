import { MouseEvent, useCallback, useMemo, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { BiCopy, BiDownload, BiMailSend, BiRightArrowAlt } from 'react-icons/bi'
import {
  Box,
  Container,
  ModalBody,
  ModalHeader,
  Stack,
  Text,
  useClipboard,
} from '@chakra-ui/react'
import dedent from 'dedent'
import FileSaver from 'file-saver'

import Button from '~components/Button'
import Checkbox from '~components/Checkbox'

import { useCreateFormWizard } from '../CreateFormWizardContext'

import { SecretKeyChoice } from './SecretKeyChoice'

/** Default hook to be used in SaveSecretKeyScreen */
const useSaveSecretKeyDefault = () => {
  const {
    formMethods: { control, register },
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
    hasActioned,
    hasCopiedKey,
    secretKey,
    register,
  } = useSaveSecretKey()

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="42.5rem" p={0}>
          Save your secret key
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-line">
        <Container maxW="42.5rem" p={0}>
          <Text textStyle="body-2" color="secondary.500" mb="2.5rem">
            You need this Secret Key to activate your form and view
            responses.&nbsp;
            <Text color="danger.500" textStyle="subhead-2" as="span">
              If you lose it, all responses will be permanently lost and Form
              will not be able to retrieve it.&nbsp;
            </Text>
            You need to at least download the key.
          </Text>
          <Stack
            spacing="-1px"
            direction={{ base: 'column', md: 'row' }}
            mb="1rem"
          >
            <SecretKeyChoice
              icon={BiDownload}
              actionTitle="Download key"
              description="Check your Downloads folder, and organise your keys in a spreadsheet."
              onActionClick={handleDownloadKey}
            />
            <SecretKeyChoice
              icon={BiMailSend}
              actionTitle="Email key"
              onActionClick={handleEmailKey}
              description="Email to yourself and collaborators for safekeeping."
            />
            <SecretKeyChoice
              wordBreak="break-all"
              icon={BiCopy}
              actionTitle={hasCopiedKey ? 'Copied!' : 'Copy key'}
              description={secretKey}
              onActionClick={handleCopyKey}
            />
          </Stack>
          <Box mb="2.5rem">
            <Checkbox
              aria-label="Storage mode form acknowledgement"
              {...register('storageAck', {
                required: true,
              })}
            >
              I acknowledge that if I lose my Secret Key, all my responses will
              be lost permanently and I cannot activate my form
            </Checkbox>
          </Box>
          <Button
            isDisabled={!hasActioned}
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

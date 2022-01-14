import { useCallback, useMemo, useState } from 'react'
import { BiCopy, BiDownload, BiMailSend, BiRightArrowAlt } from 'react-icons/bi'
import { IconType } from 'react-icons/lib'
import {
  Box,
  Container,
  Icon,
  ModalBody,
  ModalHeader,
  Stack,
  StackProps,
  Text,
  useClipboard,
} from '@chakra-ui/react'
import dedent from 'dedent'
import FileSaver from 'file-saver'

import Button from '~components/Button'
import { MailToLink } from '~components/MailToLink'

import { useCreateFormWizard } from './CreateFormWizardContext'

export const SaveSecretKeyScreen = (): JSX.Element => {
  const {
    formMethods: { watch },
    handleCreateStorageModeForm,
    isLoading,
    keypair: { secretKey },
  } = useCreateFormWizard()

  const [hasActioned, setHasActioned] = useState(false)

  const { hasCopied, onCopy } = useClipboard(secretKey)

  const titleInputValue = watch('title')

  const mailToBody = useMemo(() => {
    return dedent`
        Dear collaborator,

        I am sharing my form's secret key with you for safekeeping and backup. This is an important key that is needed to access all form responses.

        Form title: ${titleInputValue}
    
        Secret key: ${secretKey}

        All you need to do is keep this email as a record, and please do not share this key with anyone else.

        Thank you for helping to safekeep my form!`
  }, [secretKey, titleInputValue])

  const handleDownloadKey = useCallback(() => {
    FileSaver.saveAs(
      new Blob([secretKey], { type: 'text/plain;charset=utf-8' }),
      `Form Secret Key - ${titleInputValue}.txt`,
    )
    setHasActioned(true)
  }, [secretKey, titleInputValue])

  const handleCopyKey = useCallback(() => {
    onCopy()
    setHasActioned(true)
  }, [onCopy])

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
            You will need your Secret Key to activate your form and view
            responses.
            <Text color="danger.500" textStyle="subhead-2" as="span">
              If you lose it, all responses will be permanently lost and Form
              will not be able to retrieve it.
            </Text>
          </Text>
          <Text textStyle="h4" as="h4" color="secondary.500" mb="1.5rem">
            Use a combination of these methods to store your key safely
          </Text>
          <Stack
            spacing="-1px"
            direction={{ base: 'column', md: 'row' }}
            mb="2.5rem"
          >
            <SecretKeyChoice
              wordBreak="break-all"
              icon={BiCopy}
              actionTitle={hasCopied ? 'Copied!' : 'Copy key'}
              description={secretKey}
              onActionClick={handleCopyKey}
            />
            <SecretKeyChoice
              icon={BiDownload}
              actionTitle="Download key"
              description="Check your Downloads folder, and organise your keys in a spreadsheet."
              onActionClick={handleDownloadKey}
            />
            <SecretKeyChoice
              icon={BiMailSend}
              actionTitle={
                <MailToLink
                  subject={`Shared Secret Key for ${titleInputValue}`}
                  body={mailToBody}
                  children="Email key"
                />
              }
              onActionClick={() => setHasActioned(true)}
              description="Email to yourself and collaborators for safekeeping."
            />
          </Stack>
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

interface SecretKeyChoiceProps extends StackProps {
  icon: IconType
  actionTitle: React.ReactNode
  description: string
  onActionClick?: () => void
}
const SecretKeyChoice = ({
  icon,
  actionTitle,
  description,
  onActionClick,
  ...props
}: SecretKeyChoiceProps) => {
  return (
    <Stack
      bg="white"
      justify="flex-start"
      py="2rem"
      px="1.5rem"
      border="1px solid"
      borderColor="primary.300"
      spacing="0.75rem"
      _first={{
        borderStartRadius: {
          base: 'initial',
          md: '4px',
        },
        borderTopRadius: {
          base: '4px',
          md: 'initial',
        },
      }}
      _last={{
        borderEndRadius: {
          base: 'initial',
          md: '4px',
        },
        borderBottomRadius: {
          base: '4px',
          md: 'initial',
        },
      }}
      flex={1}
      {...props}
    >
      <Icon aria-hidden as={icon} color="secondary.500" fontSize="1.5rem" />
      <Box>
        <Button
          m="-0.25rem"
          variant="link"
          textDecorationLine="underline"
          onClick={onActionClick}
        >
          <Text>{actionTitle}</Text>
        </Button>
      </Box>
      <Text textStyle="body-2" color="secondary.400">
        {description}
      </Text>
    </Stack>
  )
}

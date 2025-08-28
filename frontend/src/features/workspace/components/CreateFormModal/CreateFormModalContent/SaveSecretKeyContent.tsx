import { UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiMailSend, BiRightArrowAlt } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  Code,
  Container,
  Icon,
  ListItem,
  ModalBody,
  Stack,
  Text,
  UnorderedList,
} from '@chakra-ui/react'

import { BxsCheckCircle } from '~assets/icons'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { useSaveSecretKey } from './useSaveSecretKey'

export interface SaveSecretKeyFormInput {
  storageAck: boolean
}

export const SaveSecretKeyContent = ({
  contentTitle,
  secretKey,
  formTitle,
  formId,
  onClose,
  isFormStateValid,
  handleTrackEmail,
  onSubmitClick,
  registerStorageAck,
  isLoading,
  useSaveSecretKeyHook = useSaveSecretKey,
}: {
  contentTitle: string
  secretKey: string
  formTitle: string
  formId: string
  onClose: () => void
  isFormStateValid: boolean
  handleTrackEmail: () => void
  onSubmitClick: () => void
  registerStorageAck: UseFormRegister<SaveSecretKeyFormInput>
  isLoading: boolean
  useSaveSecretKeyHook?: typeof useSaveSecretKey
}): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.workspace.modals.forms.create',
  })

  const {
    isSubmitEnabled,
    hasCopiedKey,
    handleCopyKey,
    hasDownloadedKey,
    handleDownloadKey,
    mailToHref,
  } = useSaveSecretKeyHook({
    secretKey,
    formTitle,
    formId,
    onClose,
    isFormStateValid,
  })

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
                as={BxsCheckCircle}
                fontSize="3rem"
                aria-hidden
                color="primary.500"
              />
              <Text as="header" textStyle="h2" color="secondary.700">
                {contentTitle}
              </Text>
            </Stack>
            <UnorderedList mb="2.5rem" styleType="disc" spacing={2}>
              <ListItem>
                <Text textStyle="body-1" color="secondary.500">
                  {t('secretKey.message.preamble1')}
                </Text>
              </ListItem>
              <ListItem>
                <Text textStyle="body-1" color="secondary.500">
                  {t('secretKey.message.preamble2.prefix')}
                  <Text color="danger.500" textStyle="subhead-1" as="span">
                    {t('secretKey.message.preamble2.warning')}
                  </Text>
                </Text>
              </ListItem>
            </UnorderedList>
            <Stack direction={{ base: 'column', md: 'row' }}>
              <Tooltip
                mt={0}
                label={t(
                  `secretKey.tooltip.${hasCopiedKey ? 'copied' : 'copyKey'}`,
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
                  data-chromatic="ignore" // secret key always changes in Chromatic so this should be ignored
                >
                  {secretKey}
                </Code>
              </Tooltip>
              <ButtonGroup>
                <Button onClick={handleDownloadKey}>
                  {t('secretKey.download')}
                </Button>
                <IconButton
                  as="a"
                  icon={<BiMailSend />}
                  aria-label={t('secretKey.mailSecretKey.aria')}
                  href={mailToHref}
                  variant="outline"
                  onClick={handleTrackEmail}
                />
              </ButtonGroup>
            </Stack>
          </Box>
          {hasDownloadedKey && (
            <Box mt="1rem">
              <Checkbox
                aria-label={t('secretKey.declaration.aria')}
                {...registerStorageAck('storageAck', {
                  required: true,
                })}
              >
                {t('secretKey.declaration.text')}
              </Checkbox>
            </Box>
          )}
          <Button
            mt="2.25rem"
            isDisabled={!isSubmitEnabled}
            rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
            type="submit"
            isLoading={isLoading}
            onClick={onSubmitClick}
            isFullWidth
          >
            <Text lineHeight="1.5rem">{t('secretKey.confirm')}</Text>
          </Button>
        </Container>
      </ModalBody>
    </>
  )
}

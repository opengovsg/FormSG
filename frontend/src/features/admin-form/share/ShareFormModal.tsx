import { useCallback, useEffect, useMemo, useState } from 'react'
import { BiLinkExternal } from 'react-icons/bi'
import { RemoveScroll } from 'react-remove-scroll'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Divider,
  FormControl,
  FormHelperText,
  HStack,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Stack,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'
import dedent from 'dedent'
import { StatusCodes } from 'http-status-codes'

import {
  featureFlags,
  GO_ALREADY_EXIST_ERROR_MESSAGE,
  GO_VALIDATION_ERROR_MESSAGE,
} from '~shared/constants'

import { BxsCheckCircle, BxsErrorCircle } from '~/assets/icons'

import {
  ADMINFORM_ROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
  ADMINFORM_USETEMPLATE_ROUTE,
} from '~constants/routes'
import { HttpError } from '~services/ApiService'
import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import IconButton from '~components/IconButton'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Link from '~components/Link'
import { ModalCloseButton } from '~components/Modal'
import { Tab } from '~components/Tabs'
import Textarea from '~components/Textarea'
import { CopyButton } from '~templates/CopyButton'

import { useEnv } from '~features/env/queries'
import { useFeatureFlags } from '~features/feature-flags/queries'
import { useListShortenerMutations } from '~features/link-shortener/mutations'
import { useGoLink } from '~features/link-shortener/queries'
import { useUser } from '~features/user/queries'

type goLinkHelperTextType = {
  color: string
  icon: JSX.Element
  text: JSX.Element
}

const goLinkClaimSuccessHelperText: goLinkHelperTextType = {
  color: 'success.700',
  icon: <BxsCheckCircle fontSize="1rem" />,
  text: (
    <Text>
      You have successfully claimed this link. This link will appear in your{' '}
      <Link isExternal href="https://go.gov.sg">
        Go account
      </Link>
    </Text>
  ),
}

const GO_VALIDATION_FAILED_HELPER_TEXT =
  'Short links should only consist of lowercase letters, numbers and hyphens.'
const GO_ALREADY_EXIST_HELPER_TEXT = 'Short link is already in use.'
const GO_UNEXPECTED_ERROR_HELPER_TEXT =
  'Something went wrong. Try refreshing this page. If this issue persists, contact support@form.gov.sg.'

const getGoLinkClaimFailureHelperText = (
  text: string,
): goLinkHelperTextType => {
  return {
    color: 'danger.500',
    icon: <BxsErrorCircle fontSize="1rem" />,
    text: <Text>{text}</Text>,
  }
}

export interface ShareFormModalProps {
  isOpen: boolean
  onClose: () => void
  /**
   * ID of form to generate share link for. If not provided, modal will be in a
   * loading state
   */
  formId: string | undefined
  isFormPrivate: boolean | undefined
}

const FormActivationMessage = ({
  isFormPrivate,
  formId,
  onClose,
}: {
  isFormPrivate: boolean | undefined
  onClose: () => void
  formId: string | undefined
}) => {
  const navigate = useNavigate()
  const handleRedirectToSettings = useCallback(() => {
    onClose()
    navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_SETTINGS_SUBROUTE}`)
  }, [formId, navigate, onClose])

  if (!isFormPrivate) return null

  return (
    <InlineMessage variant="warning" mb="1rem">
      <Box>
        This form is currently closed to new responses. Activate your form in{' '}
        <Button p={0} variant="link" onClick={handleRedirectToSettings}>
          Settings
        </Button>{' '}
        to allow new responses or to share it as a template.
      </Box>
    </InlineMessage>
  )
}

export const ShareFormModal = ({
  isOpen,
  onClose,
  formId,
  isFormPrivate,
}: ShareFormModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const { data: { goGovBaseUrl } = {} } = useEnv()

  const { data: flags } = useFeatureFlags()
  const displayGoLink = flags?.has(featureFlags.goLinks)

  // Hard-coded .gov.sg whitelist for GoGov integration
  const gogovWhiteListed = '.gov.sg'
  const { user } = useUser()
  const whitelisted = useMemo(
    () => user?.email.endsWith(gogovWhiteListed),
    [user?.email],
  )

  const shareLink = useMemo(
    () => `${window.location.origin}/${formId}`,
    [formId],
  )

  const templateLink = useMemo(
    () =>
      `${window.location.origin}${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_USETEMPLATE_ROUTE}`,
    [formId],
  )

  const embeddedHtml = useMemo(() => {
    return dedent(`
      <div
        style="
          font-family: Sans-Serif;
          font-size: 15px;
          color: #000;
          opacity: 0.9;
          padding-top: 5px;
          padding-bottom: 8px;
        "
      >
        If the form below is not loaded, you can also fill it in at
        <a href="${shareLink}">here</a>.
      </div>

      <!-- Change the width and height values to suit you best -->
      <iframe
        id="iframe"
        src="${shareLink}"
        style="width: 100%; height: 500px"
      ></iframe>

      <div
        style="
          font-family: Sans-Serif;
          font-size: 12px;
          color: #999;
          opacity: 0.5;
          padding-top: 5px;
        "
      >
        Powered by <a href="${window.location.origin}" style="color: #999">Form</a>
      </div>
    `)
  }, [shareLink])

  const { data: goLinkSuffixData } = useGoLink(formId ?? '')
  const [goLinkSuffixInput, setGoLinkSuffixInput] = useState('')
  const [goLinkSaved, setGoLinkSaved] = useState(false)
  const [claimGoLoading, setClaimGoLoading] = useState(false)

  useEffect(() => {
    if (goLinkSuffixData?.goLinkSuffix) {
      setGoLinkSaved(true)
      setGoLinkSuffixInput(goLinkSuffixData?.goLinkSuffix ?? '')
      setGoLinkHelperText(goLinkClaimSuccessHelperText)
    }
    return () => {
      // before unmount or after any changes to goLinkSuffix, will reset the states first
      setGoLinkSaved(false)
      setGoLinkSuffixInput('')
      setGoLinkHelperText(undefined)
    }
  }, [goLinkSuffixData?.goLinkSuffix])

  const { claimGoLinkMutation } = useListShortenerMutations(formId ?? '')

  const [goLinkHelperText, setGoLinkHelperText] = useState<
    goLinkHelperTextType | undefined
  >()

  const handleClaimGoLinkClick = useCallback(async () => {
    try {
      if (!user) throw Error('User not loaded yet')

      setClaimGoLoading(true)
      await claimGoLinkMutation.mutateAsync({
        linkSuffix: goLinkSuffixInput,
        adminEmail: user.email,
      })
      setClaimGoLoading(false)
      setGoLinkSaved(true)
      setGoLinkHelperText(goLinkClaimSuccessHelperText)
      return
    } catch (err) {
      setClaimGoLoading(false)

      let errMessage = GO_UNEXPECTED_ERROR_HELPER_TEXT

      if (err instanceof HttpError && err.code === StatusCodes.BAD_REQUEST)
        switch (err.message) {
          case GO_VALIDATION_ERROR_MESSAGE:
            errMessage = GO_VALIDATION_FAILED_HELPER_TEXT
            break
          case GO_ALREADY_EXIST_ERROR_MESSAGE:
            errMessage = GO_ALREADY_EXIST_HELPER_TEXT
            break
          default:
          // will use unexpected error text
        }

      setGoLinkHelperText(getGoLinkClaimFailureHelperText(errMessage))
      return
    }
  }, [user, claimGoLinkMutation, goLinkSuffixInput])

  const FormLinkSection = () => (
    <FormControl isReadOnly>
      <FormLabel isRequired>Form link</FormLabel>
      <Skeleton isLoaded={!!formId}>
        <Stack direction="row" align="center">
          <InputGroup>
            <Input
              // The link will always change in Chromatic so this should be ignored.
              data-chromatic="ignore"
              isReadOnly
              value={shareLink}
              hasInputRightElement={Boolean(formId)}
            />
            {formId ? (
              <InputRightElement>
                <CopyButton
                  colorScheme="secondary"
                  stringToCopy={shareLink}
                  aria-label="Copy respondent form link"
                />
              </InputRightElement>
            ) : null}
          </InputGroup>
          <IconButton
            as="a"
            icon={<BiLinkExternal fontSize="1.5rem" />}
            href={shareLink}
            target="_blank"
            rel="noopener"
            aria-label="Open link in new tab"
          />
        </Stack>
      </Skeleton>
    </FormControl>
  )

  const TemplateSection = () => (
    <FormControl isReadOnly>
      <FormLabel isRequired>Share template</FormLabel>
      <Skeleton isLoaded={!!formId}>
        <InputGroup>
          <Input
            // The link will always change in Chromatic so this should be ignored.
            data-chromatic="ignore"
            isReadOnly
            isDisabled={isFormPrivate}
            value={`${templateLink}`}
            hasInputRightElement={Boolean(formId)}
          />
          {formId ? (
            <InputRightElement>
              <CopyButton
                colorScheme="secondary"
                stringToCopy={`${templateLink}`}
                aria-label="Copy link to use this form as a template"
                isDisabled={isFormPrivate}
              />
            </InputRightElement>
          ) : null}
        </InputGroup>
      </Skeleton>
    </FormControl>
  )

  const EmbedSection = () => (
    <FormControl isReadOnly>
      <FormLabel isRequired>Embed HTML</FormLabel>
      <Skeleton isLoaded={!!formId}>
        <InputGroup>
          <Textarea
            pr="2.75rem"
            fontFamily="monospace"
            textStyle="body-1"
            isReadOnly
            value={embeddedHtml}
          />
          {formId ? (
            <InputRightElement>
              <CopyButton
                bg="white"
                colorScheme="secondary"
                stringToCopy={embeddedHtml}
                aria-label="Copy HTML code for embedding this form"
              />
            </InputRightElement>
          ) : null}
        </InputGroup>
      </Skeleton>
    </FormControl>
  )

  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      {/* HACK: Chakra isn't able to cleanly handle nested scroll locks https://github.com/chakra-ui/chakra-ui/issues/7723 
          We'll override chakra's <RemoveScroll /> manually as react-remove-scroll give priority to the latest mounted instance 
      */}
      <RemoveScroll>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader color="secondary.700">Share form</ModalHeader>
          <ModalBody whiteSpace="pre-wrap">
            <Tabs
              pos="relative"
              h="100%"
              display="flex"
              flexDir="column"
              isLazy
            >
              <Box bg="white">
                <TabList mx="-0.25rem" w="100%">
                  <Tab>Link</Tab>
                  <Tab>Template</Tab>
                  <Tab>Embed</Tab>
                </TabList>
                <Divider w="auto" />
              </Box>
              <TabPanels mt="1.5rem" pb="2rem" flex={1} overflowY="auto">
                <TabPanel>
                  <FormActivationMessage
                    isFormPrivate={isFormPrivate}
                    formId={formId}
                    onClose={onClose}
                  />
                  <FormLinkSection />
                  {/* GoLinkSection */}
                  {(displayGoLink && whitelisted) ||
                  goLinkSuffixData?.goLinkSuffix ? (
                    <FormControl mt="1rem">
                      <FormLabel
                        isRequired
                        description="Create an official short link and share it over the Internet."
                      >
                        Go link
                      </FormLabel>
                      <Skeleton isLoaded={!!formId}>
                        <Stack direction="row" align="center">
                          <InputGroup>
                            <InputLeftAddon children={`go.gov.sg/`} />
                            <Input
                              value={goLinkSuffixInput}
                              onChange={(e) => {
                                setGoLinkSuffixInput(e.target.value)
                                setGoLinkHelperText(undefined)
                              }}
                              isReadOnly={goLinkSaved}
                              hasInputRightElement={goLinkSaved}
                            />
                            {goLinkSaved ? (
                              <InputRightElement>
                                <CopyButton
                                  colorScheme="secondary"
                                  stringToCopy={`${goGovBaseUrl}/${goLinkSuffixInput}`}
                                  aria-label="Copy respondent form link"
                                />
                              </InputRightElement>
                            ) : null}
                          </InputGroup>
                          {goLinkSaved ? null : (
                            <Button
                              aria-label="Claim Go link"
                              onClick={handleClaimGoLinkClick}
                              isDisabled={!goLinkSuffixInput}
                              isLoading={claimGoLoading}
                            >
                              Claim
                            </Button>
                          )}
                        </Stack>
                        {goLinkHelperText && (
                          // padding on icon box to emulate padding from <Text>
                          <FormHelperText color={goLinkHelperText.color}>
                            <HStack alignItems="flex-start">
                              <Box py="2px">{goLinkHelperText.icon}</Box>
                              <Box>{goLinkHelperText.text}</Box>
                            </HStack>
                          </FormHelperText>
                        )}
                      </Skeleton>
                    </FormControl>
                  ) : null}
                </TabPanel>
                <TabPanel>
                  <FormActivationMessage
                    isFormPrivate={isFormPrivate}
                    formId={formId}
                    onClose={onClose}
                  />
                  <TemplateSection />
                </TabPanel>
                <TabPanel>
                  <FormActivationMessage
                    isFormPrivate={isFormPrivate}
                    formId={formId}
                    onClose={onClose}
                  />
                  <EmbedSection />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </RemoveScroll>
    </Modal>
  )
}

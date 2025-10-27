import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
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

const getGoLinkClaimSuccessHelperText = (
  t: (key: string) => string,
): goLinkHelperTextType => {
  return {
    color: 'success.700',
    icon: <BxsCheckCircle fontSize="1rem" />,
    text: (
      <Text>
        <Trans
          i18nKey="features.adminForm.share.goLink.success.text"
          components={{
            goAccountLink: <Link isExternal href="https://go.gov.sg" />,
          }}
        />
      </Text>
    ),
  }
}

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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.share',
  })
  const navigate = useNavigate()
  const handleRedirectToSettings = useCallback(() => {
    onClose()
    navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_SETTINGS_SUBROUTE}`)
  }, [formId, navigate, onClose])

  if (!isFormPrivate) return null

  return (
    <InlineMessage variant="warning" mb="1rem">
      <Box>
        <Trans
          i18nKey="features.adminForm.share.formActivation.message"
          components={{
            settingsLink: (
              <Button p={0} variant="link" onClick={handleRedirectToSettings} />
            ),
          }}
        />
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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.share',
  })
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
        ${t('embed.fallbackText')}
        <a href="${shareLink}">${t('embed.here')}</a>.
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
        ${t('embed.poweredBy')} <a href="${window.location.origin}" style="color: #999">Form</a>
      </div>
    `)
  }, [shareLink, t])

  const { data: goLinkSuffixData } = useGoLink(formId ?? '')
  const [goLinkSuffixInput, setGoLinkSuffixInput] = useState('')
  const [goLinkSaved, setGoLinkSaved] = useState(false)
  const [claimGoLoading, setClaimGoLoading] = useState(false)

  useEffect(() => {
    if (goLinkSuffixData?.goLinkSuffix) {
      setGoLinkSaved(true)
      setGoLinkSuffixInput(goLinkSuffixData?.goLinkSuffix ?? '')
      setGoLinkHelperText(getGoLinkClaimSuccessHelperText(t))
    }
    return () => {
      // before unmount or after any changes to goLinkSuffix, will reset the states first
      setGoLinkSaved(false)
      setGoLinkSuffixInput('')
      setGoLinkHelperText(undefined)
    }
  }, [goLinkSuffixData?.goLinkSuffix, t])

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
      setGoLinkHelperText(getGoLinkClaimSuccessHelperText(t))
      return
    } catch (err) {
      setClaimGoLoading(false)

      let errMessage = t('goLink.errors.unexpected')

      if (err instanceof HttpError && err.code === StatusCodes.BAD_REQUEST)
        switch (err.message) {
          case GO_VALIDATION_ERROR_MESSAGE:
            errMessage = t('goLink.errors.validation')
            break
          case GO_ALREADY_EXIST_ERROR_MESSAGE:
            errMessage = t('goLink.errors.alreadyExists')
            break
          default:
          // will use unexpected error text
        }

      setGoLinkHelperText(getGoLinkClaimFailureHelperText(errMessage))
      return
    }
  }, [user, claimGoLinkMutation, goLinkSuffixInput, t])

  const FormLinkSection = () => (
    <FormControl isReadOnly>
      <FormLabel isRequired>{t('formLink.label')}</FormLabel>
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
                  aria-label={t('formLink.copyAriaLabel')}
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
            aria-label={t('formLink.openAriaLabel')}
          />
        </Stack>
      </Skeleton>
    </FormControl>
  )

  const TemplateSection = () => (
    <FormControl isReadOnly>
      <FormLabel isRequired>{t('template.label')}</FormLabel>
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
                aria-label={t('template.copyAriaLabel')}
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
      <FormLabel isRequired>{t('embed.label')}</FormLabel>
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
                aria-label={t('embed.copyAriaLabel')}
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
          <ModalHeader color="secondary.700">{t('modal.header')}</ModalHeader>
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
                  <Tab>{t('tabs.link')}</Tab>
                  <Tab>{t('tabs.template')}</Tab>
                  <Tab>{t('tabs.embed')}</Tab>
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
                        description={t('goLink.description')}
                      >
                        {t('goLink.label')}
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
                                  aria-label={t('goLink.copyAriaLabel')}
                                />
                              </InputRightElement>
                            ) : null}
                          </InputGroup>
                          {goLinkSaved ? null : (
                            <Button
                              aria-label={t('goLink.claimAriaLabel')}
                              onClick={handleClaimGoLinkClick}
                              isDisabled={!goLinkSuffixInput}
                              isLoading={claimGoLoading}
                            >
                              {t('goLink.claim')}
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

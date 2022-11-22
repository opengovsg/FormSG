import { useCallback, useMemo } from 'react'
import { BiLinkExternal } from 'react-icons/bi'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  FormControl,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Stack,
  useBreakpointValue,
} from '@chakra-ui/react'
import dedent from 'dedent'

import {
  ADMINFORM_ROUTE,
  ADMINFORM_SETTINGS_SUBROUTE,
  ADMINFORM_USETEMPLATE_ROUTE,
} from '~constants/routes'
import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import IconButton from '~components/IconButton'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import { ModalCloseButton } from '~components/Modal'
import Textarea from '~components/Textarea'
import { CopyButton } from '~templates/CopyButton'

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

export const ShareFormModal = ({
  isOpen,
  onClose,
  formId,
  isFormPrivate,
}: ShareFormModalProps): JSX.Element => {
  const navigate = useNavigate()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

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

  const handleRedirectToSettings = useCallback(() => {
    onClose()
    navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_SETTINGS_SUBROUTE}`)
  }, [formId, navigate, onClose])

  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">Share form</ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Stack spacing="1rem" pb="2rem">
            {isFormPrivate ? (
              <InlineMessage variant="warning">
                <Box>
                  This form is currently closed to new responses. Activate your
                  form in{' '}
                  <Button
                    p={0}
                    variant="link"
                    onClick={handleRedirectToSettings}
                  >
                    Settings
                  </Button>{' '}
                  to allow new responses or to share it as a template.
                </Box>
              </InlineMessage>
            ) : null}
            <FormControl isReadOnly>
              <FormLabel
                isRequired
                useMarkdownForDescription
                description="Create an official short link and QR code with [Go.gov.sg](https://go.gov.sg) and share it over the Internet."
              >
                Share link
              </FormLabel>

              <Skeleton isLoaded={!!formId}>
                <Stack direction="row" align="center">
                  <InputGroup>
                    <Input
                      // The link will always change in Chromatic so this should be ignored.
                      data-chromatic="ignore"
                      isReadOnly
                      value={shareLink}
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
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

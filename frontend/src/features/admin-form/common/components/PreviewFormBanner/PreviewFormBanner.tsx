import { useCallback } from 'react'
import { BiShow } from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import { Waypoint } from 'react-waypoint'
import {
  Flex,
  Icon,
  Portal,
  Slide,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { ADMINFORM_ROUTE, DASHBOARD_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import Link from '~components/Link'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'
import { DuplicateFormModal } from '~features/workspace/components/DuplicateFormModal'

export const StickyPreviewHeader = ({
  isOpen,
}: {
  isOpen: boolean
}): JSX.Element => (
  <Portal>
    <Slide aria-hidden direction="top" in={isOpen}>
      <PreviewFormBanner isTemplate />
    </Slide>
  </Portal>
)
interface PreviewFormBannerProps {
  isTemplate?: boolean
}

export const PreviewFormBanner = ({
  isTemplate,
}: PreviewFormBannerProps): JSX.Element => {
  const { formId } = usePublicFormContext()
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <>
      <Flex bg="primary.100" py="1rem" px="2rem" display="flex" width="100%">
        <Flex align="center" flex={1} justify="space-between" flexDir="row">
          <Flex align="center">
            <Icon aria-hidden as={BiShow} fontSize="1rem" mr="0.75rem" />
            <Text textStyle="subhead-3">Form Preview</Text>
          </Flex>
          {isTemplate ? (
            <Stack spacing="1rem" direction="row">
              <Link
                variant="standalone"
                aria-label="Click to return to the admin dashboard"
                as={ReactLink}
                to={DASHBOARD_ROUTE}
              >
                Back to FormSG
              </Link>
              <Button aria-label="Click to use this template" onClick={onOpen}>
                Use this template
              </Button>
            </Stack>
          ) : (
            <Button
              aria-label="Click to edit the form"
              as={ReactLink}
              to={`${ADMINFORM_ROUTE}/${formId}`}
            >
              Edit form
            </Button>
          )}
        </Flex>
        <DuplicateFormModal
          formId={formId}
          isTemplate
          isOpen={isOpen}
          onClose={onClose}
        />
      </Flex>
    </>
  )
}

export const PreviewFormBannerContainer = ({
  isTemplate,
}: PreviewFormBannerProps): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const handlePositionChange = useCallback(
    (pos: Waypoint.CallbackArgs) => {
      // Required so a page that loads in the middle of the page can still
      // trigger the mini header.
      if (pos.currentPosition === 'above') {
        onOpen()
      } else {
        onClose()
      }
    },
    [onClose, onOpen],
  )

  return (
    <>
      {isTemplate ? <StickyPreviewHeader isOpen={isOpen} /> : null}
      <PreviewFormBanner isTemplate={isTemplate} />
      {
        /* Sentinel to know when sticky navbar is starting */

        <Waypoint topOffset="64px" onPositionChange={handlePositionChange} />
      }
    </>
  )
}

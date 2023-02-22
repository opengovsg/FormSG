import { useCallback, useMemo } from 'react'
import { BiArrowBack, BiDotsHorizontalRounded, BiShow } from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import { Waypoint } from 'react-waypoint'
import {
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Icon,
  IconButton,
  Portal,
  Slide,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { ADMINFORM_ROUTE, DASHBOARD_ROUTE } from '~constants/routes'
import Button, { ButtonProps } from '~components/Button'
import Link from '~components/Link'

import { UseTemplateModal } from '~features/admin-form/template/UseTemplateModal'
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
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure()
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure()
  const mobileDrawerButtonProps: Partial<ButtonProps> = useMemo(
    () => ({
      isFullWidth: true,
      iconSpacing: '1rem',
      justifyContent: 'flex-start',
      variant: 'clear',
      colorScheme: 'secondary',
      textStyle: 'body-1',
    }),
    [],
  )
  return (
    <>
      <Flex
        bg="primary.100"
        py="1rem"
        px={{ base: '1.5rem', md: '2rem' }}
        display="flex"
        width="100%"
      >
        <Flex align="center" flex={1} justify="space-between" flexDir="row">
          <Flex align="center">
            <Icon
              aria-hidden
              as={BiShow}
              fontSize="1.5rem"
              mr={{ base: '0.5rem', md: '1rem' }}
            />
            <Text textStyle="subhead-3">
              {isTemplate ? 'Template Preview' : 'Form Preview'}
            </Text>
          </Flex>
          {isTemplate ? (
            <>
              <Stack
                spacing="1rem"
                direction="row"
                d={{ base: 'none', md: 'flex' }}
              >
                <Link
                  variant="standalone"
                  aria-label="Click to return to the admin dashboard"
                  as={ReactLink}
                  to={DASHBOARD_ROUTE}
                >
                  Back to FormSG
                </Link>
                <Button
                  aria-label="Click to use this template"
                  onClick={onModalOpen}
                >
                  Use this template
                </Button>
              </Stack>
              <IconButton
                color="primary.500"
                variant="clear"
                display={{ base: 'flex', md: 'none' }}
                aria-label="Template preview actions"
                onClick={onDrawerOpen}
                icon={<BiDotsHorizontalRounded />}
              />
            </>
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
        {isTemplate ? (
          <UseTemplateModal
            formId={formId}
            isOpen={isModalOpen}
            onClose={onModalClose}
          />
        ) : (
          <DuplicateFormModal isOpen={isModalOpen} onClose={onModalClose} />
        )}
        <Drawer
          placement="bottom"
          onClose={onDrawerClose}
          isOpen={isDrawerOpen}
        >
          <DrawerOverlay />
          <DrawerContent borderTopRadius="0.25rem">
            <DrawerBody px={0} py="0.5rem">
              <Button
                onClick={onModalOpen}
                isFullWidth={true}
                {...mobileDrawerButtonProps}
              >
                Use this template
              </Button>
              <Divider />
              <Button
                as={ReactLink}
                to={DASHBOARD_ROUTE}
                leftIcon={<BiArrowBack fontSize="1.25rem" />}
                {...mobileDrawerButtonProps}
              >
                Back to FormSG
              </Button>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Flex>
      <Divider />
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

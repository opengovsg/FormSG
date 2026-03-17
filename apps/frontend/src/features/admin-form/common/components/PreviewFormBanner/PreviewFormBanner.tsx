import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  TextProps,
  useDisclosure,
} from '@chakra-ui/react'

import { FORMSG_UAT } from '~constants/links'
import { ADMINFORM_ROUTE, DASHBOARD_ROUTE } from '~constants/routes'
import Button, { ButtonProps } from '~components/Button'
import Link from '~components/Link'

import { UseTemplateModal } from '~features/admin-form/template/UseTemplateModal'
import { useEnv } from '~features/env/queries'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'
// Explicit import to avoid circular dependency warnings by rollup
import { DuplicateFormModal } from '~features/workspace/components/DuplicateFormModal/DuplicateFormModal'

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

const textProps: TextProps = {
  textStyle: 'body-2',
  color: 'white',
  mx: '2rem',
  mt: '0.5rem',
  mb: '0.5rem',
}

export const PreviewFormBanner = ({
  isTemplate,
}: PreviewFormBannerProps): JSX.Element => {
  const { t } = useTranslation()
  const { formId, isPaymentEnabled } = usePublicFormContext()
  const { data: { secretEnv } = {} } = useEnv()
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
                display={{ base: 'none', md: 'flex' }}
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
              aria-label={t('features.common.editForm.ariaLabel')}
              as={ReactLink}
              to={`${ADMINFORM_ROUTE}/${formId}`}
            >
              {t('features.common.editForm.text')}
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
      {isPaymentEnabled && (
        <Flex backgroundColor="neutral.900">
          {secretEnv === 'production' ? (
            <Text {...textProps}>
              To test your payment form, replicate this form on our{' '}
              <Link isExternal color="white" href={FORMSG_UAT}>
                testing platform.
              </Link>
            </Text>
          ) : (
            <Text {...textProps}>
              You will not be able to make a test payment, or view submitted
              answers or attachments in Form Preview mode. Open your form to
              make a test payment or form submission.
            </Text>
          )}
        </Flex>
      )}
      {!isPaymentEnabled && (
        <Flex backgroundColor="neutral.900">
          {!(secretEnv === 'production') && (
            <Text {...textProps}>
              You will not be able to view submitted answers or attachments in
              Form Preview mode. Open your form to test a form submission.
            </Text>
          )}
        </Flex>
      )}
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

import { useCallback, useMemo } from 'react'
import { BiLogOutCircle } from 'react-icons/bi'
import { Waypoint } from 'react-waypoint'
import {
  Box,
  Flex,
  Icon,
  Skeleton,
  Slide,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import simplur from 'simplur'

import { FormAuthType, FormColorTheme } from '~shared/types/form/form'

import { BxMenuAltLeft } from '~assets/icons/BxMenuAltLeft'
import { BxsTimeFive } from '~assets/icons/BxsTimeFive'
import Button from '~components/Button'
import IconButton from '~components/IconButton'

import { usePublicAuthMutations } from '~features/public-form/mutations'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import {
  FormSectionsProvider,
  useFormSections,
} from '../FormFields/FormSectionsContext'

const useFormHeader = () => {
  const { form, spcpSession, formId, submissionData, miniHeaderRef } =
    usePublicFormContext()
  const { handleLogoutMutation } = usePublicAuthMutations(formId)

  const titleColour = useMemo(() => {
    if (form?.startPage.colorTheme === FormColorTheme.Orange) {
      return 'secondary.700'
    }
    return 'white'
  }, [form?.startPage.colorTheme])

  const titleBg = useMemo(
    () =>
      form?.startPage.colorTheme
        ? `theme-${form.startPage.colorTheme}.500`
        : `neutral.200`,
    [form?.startPage.colorTheme],
  )

  const estTimeString = useMemo(() => {
    if (!form?.startPage.estTimeTaken) return ''
    return simplur`${form?.startPage.estTimeTaken} min[|s] estimated time to complete`
  }, [form])

  const handleLogout = useCallback(() => {
    if (!form || form?.authType === FormAuthType.NIL) return
    return handleLogoutMutation.mutate(form.authType)
  }, [form, handleLogoutMutation])

  return {
    title: form?.title,
    estTimeString,
    titleBg,
    titleColour,
    loggedInId: spcpSession?.userName,
    showHeader: !submissionData,
    miniHeaderRef,
    handleLogout,
    form,
  }
}

export interface MiniHeaderProps {
  isOpen: boolean
}

// Exported for testing.
export const MiniHeader = ({ isOpen }: MiniHeaderProps): JSX.Element | null => {
  const { handleMobileSectionSidebarOpen } = usePublicFormContext()
  const { activeSectionId } = useFormSections()

  const { title, titleBg, titleColour, showHeader, miniHeaderRef } =
    useFormHeader()

  if (!showHeader) return null

  return (
    <Flex>
      <Slide
        // Screen readers do not need to know of the existence of this component.
        aria-hidden
        ref={miniHeaderRef}
        direction="top"
        in={isOpen}
        style={{ zIndex: 1000 }}
      >
        <Box bg={titleBg} px="1.5rem" py="1rem">
          <Skeleton isLoaded={!!title}>
            <Flex align="center" flex={1} justify="space-between" flexDir="row">
              <Text
                as="h2"
                textStyle="h2"
                textAlign="start"
                color={titleColour}
              >
                {title ?? 'Loading title'}
              </Text>
              {activeSectionId ? (
                // Section sidebar icon should only show up if sections exist
                <IconButton
                  variant="solid"
                  colorScheme="primary"
                  aria-label="Mobile section sidebar"
                  fontSize="1.5rem"
                  icon={<BxMenuAltLeft />}
                  d={{ base: 'flex', md: 'none' }}
                  onClick={handleMobileSectionSidebarOpen}
                />
              ) : (
                <></>
              )}
            </Flex>
          </Skeleton>
        </Box>
      </Slide>
    </Flex>
  )
}

export const FormHeader = (): JSX.Element | null => {
  const {
    title,
    estTimeString,
    titleBg,
    titleColour,
    loggedInId,
    handleLogout,
    showHeader,
    form,
  } = useFormHeader()
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

  if (!showHeader) return null

  return (
    <>
      <FormSectionsProvider form={form}>
        <MiniHeader isOpen={isOpen} />
      </FormSectionsProvider>
      <Flex
        px={{ base: '1.5rem', md: '3rem' }}
        py={{ base: '2rem', md: '3rem' }}
        justify="center"
        bg={titleBg}
      >
        <Flex
          maxW="57rem"
          flexDir="column"
          align={{ base: 'start', md: 'center' }}
          color={titleColour}
        >
          <Skeleton isLoaded={!!title}>
            <Text
              as="h1"
              textStyle="h1"
              textAlign={{ base: 'start', md: 'center' }}
            >
              {title ?? 'Loading title'}
            </Text>
          </Skeleton>
          {estTimeString && (
            <Flex align="flex-start" justify="center" mt="0.875rem">
              <Icon
                as={BxsTimeFive}
                fontSize="1.5rem"
                mr="0.5rem"
                d={{ base: 'initial', md: 'none' }}
              />
              <Text textStyle="body-2" mt="0.125rem">
                {estTimeString}
              </Text>
            </Flex>
          )}
          {loggedInId ? (
            <Button
              mt="2.25rem"
              variant="reverse"
              aria-label="Log out"
              rightIcon={<BiLogOutCircle fontSize="1.5rem" />}
              onClick={handleLogout}
            >
              {loggedInId} - Log out
            </Button>
          ) : null}
        </Flex>
      </Flex>
      {/* Sentinel to know when sticky navbar is starting */}
      <Waypoint topOffset="64px" onPositionChange={handlePositionChange} />
    </>
  )
}

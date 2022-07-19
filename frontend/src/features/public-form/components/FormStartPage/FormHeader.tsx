import { RefObject } from 'react'
import { BiLogOutCircle } from 'react-icons/bi'
import { Box, Flex, Icon, Skeleton, Slide, Text } from '@chakra-ui/react'

import { BxMenuAltLeft } from '~assets/icons/BxMenuAltLeft'
import { BxsTimeFive } from '~assets/icons/BxsTimeFive'
import Button from '~components/Button'
import IconButton from '~components/IconButton'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from '../FormFields/FormSectionsContext'

export interface MiniHeaderProps {
  title?: string
  titleBg: string
  titleColor: string
  showHeader?: boolean
  miniHeaderRef?: RefObject<HTMLDivElement>
  isOpen: boolean
}

export const MiniHeader = ({
  title,
  titleBg,
  titleColor,
  showHeader,
  miniHeaderRef,
  isOpen,
}: MiniHeaderProps): JSX.Element | null => {
  const { onMobileDrawerOpen } = usePublicFormContext()
  const { activeSectionId } = useFormSections()

  if (!showHeader) return null

  return (
    <Slide
      // Screen readers do not need to know of the existence of this component.
      aria-hidden
      ref={miniHeaderRef}
      direction="top"
      in={isOpen}
      style={{ zIndex: 1000 }}
    >
      <Box
        bg={titleBg}
        px={{ base: '1.5rem', md: '2rem' }}
        py={{ base: '0.5rem', md: '1rem' }}
      >
        <Skeleton isLoaded={!!title}>
          <Flex
            align="center"
            flex={1}
            gap="0.5rem"
            justify="space-between"
            flexDir="row"
          >
            <Flex alignItems="center" minH={{ base: '4rem', md: '0' }}>
              <Text
                textStyle={{ base: 'h4', md: 'h2' }}
                textAlign="start"
                color={titleColor}
              >
                {title ?? 'Loading title'}
              </Text>
            </Flex>
            {activeSectionId ? (
              // Section sidebar icon should only show up if sections exist
              <IconButton
                variant="solid"
                colorScheme="primary"
                aria-label="Mobile section sidebar"
                fontSize="1.5rem"
                icon={<BxMenuAltLeft />}
                d={{ base: 'flex', md: 'none' }}
                onClick={onMobileDrawerOpen}
              />
            ) : (
              <></>
            )}
          </Flex>
        </Skeleton>
      </Box>
    </Slide>
  )
}

interface FormHeaderInputProps {
  title?: string
  estTimeString: string
  titleBg: string
  titleColor: string
  showHeader: boolean
  loggedInId?: string
  miniHeaderRef?: RefObject<HTMLDivElement>
  handleLogout?: () => void
}

export const FormHeader = ({
  title,
  estTimeString,
  titleBg,
  titleColor,
  showHeader,
  loggedInId,
  miniHeaderRef,
  handleLogout,
}: FormHeaderInputProps): JSX.Element | null => {
  if (!showHeader) return null

  return (
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
        color={titleColor}
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
            <Icon as={BxsTimeFive} fontSize="1.5rem" mr="0.5rem" />
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
            isDisabled={!handleLogout}
          >
            {loggedInId} - Log out
          </Button>
        ) : null}
      </Flex>
    </Flex>
  )
}

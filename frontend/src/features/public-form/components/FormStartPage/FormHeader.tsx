import { RefObject, useCallback } from 'react'
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

import { BxsTimeFive } from '~assets/icons/BxsTimeFive'
import Button from '~components/Button'

export interface MiniHeaderProps
  extends Pick<
    FormHeaderInputProps,
    'title' | 'titleBg' | 'titleColor' | 'miniHeaderRef'
  > {
  isOpen: boolean
}

// Exported for testing.
export const MiniHeader = ({
  title,
  titleBg,
  titleColor,
  miniHeaderRef,
  isOpen,
}: MiniHeaderProps): JSX.Element | null => {
  return (
    <Slide
      // Screen readers do not need to know of the existence of this component.
      aria-hidden
      ref={miniHeaderRef}
      direction="top"
      in={isOpen}
      style={{ zIndex: 10 }}
    >
      <Box bg={titleBg} px="2rem" py="1rem">
        <Skeleton isLoaded={!!title}>
          <Text as="h2" textStyle="h2" textAlign="start" color={titleColor}>
            {title ?? 'Loading title'}
          </Text>
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
  loggedInId?: string
  miniHeaderRef?: RefObject<HTMLDivElement>
  handleLogout?: () => void
}

export const FormHeader = ({
  title,
  estTimeString,
  titleBg,
  titleColor,
  loggedInId,
  miniHeaderRef,
  handleLogout,
}: FormHeaderInputProps): JSX.Element | null => {
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
      <MiniHeader
        title={title}
        titleBg={titleBg}
        titleColor={titleColor}
        miniHeaderRef={miniHeaderRef}
        isOpen={isOpen}
      />
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
      {/* Sentinel to know when sticky navbar is starting */}
      <Waypoint topOffset="64px" onPositionChange={handlePositionChange} />
    </>
  )
}

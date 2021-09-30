import { useCallback, useMemo } from 'react'
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

import { FormColorTheme } from '~shared/types/form/form'

import { BxsTimeFive } from '~assets/icons/BxsTimeFive'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'
import { usePublicForm } from '~features/public-form/queries'

const useFormHeader = () => {
  const { data } = usePublicForm()

  const titleColour = useMemo(() => {
    if (data?.startPage.colorTheme === FormColorTheme.Orange) {
      return 'secondary.700'
    }
    return 'white'
  }, [data?.startPage.colorTheme])

  const titleBg = useMemo(
    () =>
      data?.startPage.colorTheme
        ? `theme-${data.startPage.colorTheme}.500`
        : undefined,
    [data?.startPage.colorTheme],
  )

  const estTimeString = useMemo(() => {
    if (!data || !data.startPage.estTimeTaken) return ''
    return simplur`${data.startPage.estTimeTaken} min[|s] estimated time to complete`
  }, [data])

  return {
    title: data?.title,
    estTimeString,
    titleBg,
    titleColour,
  }
}

interface MiniHeaderProps {
  isOpen: boolean
}

const MiniHeader = ({ isOpen }: MiniHeaderProps): JSX.Element => {
  const { title, titleBg, titleColour } = useFormHeader()

  const { miniHeaderRef } = usePublicFormContext()

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
          <Text as="h2" textStyle="h2" textAlign="start" color={titleColour}>
            {title ?? 'Loading title'}
          </Text>
        </Skeleton>
      </Box>
    </Slide>
  )
}

export const FormHeader = (): JSX.Element => {
  const { title, estTimeString, titleBg, titleColour } = useFormHeader()
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
      <MiniHeader isOpen={isOpen} />
      <Flex p="3rem" justify="center" bg={titleBg}>
        <Flex
          maxW="32.5rem"
          flexDir="column"
          align="center"
          color={titleColour}
        >
          <Skeleton isLoaded={!!title}>
            <Text as="h1" textStyle="h1" textAlign="center">
              {title ?? 'Loading title'}
            </Text>
          </Skeleton>
          {estTimeString && (
            <Flex align="center" justify="center" mt="1rem">
              <Icon as={BxsTimeFive} fontSize="1.5rem" mr="0.5rem" />
              <Text textStyle="body-2">{estTimeString}</Text>
            </Flex>
          )}
        </Flex>
      </Flex>
      {/* Sentinel to know when sticky navbar is starting */}
      <Waypoint topOffset="64px" onPositionChange={handlePositionChange} />
    </>
  )
}

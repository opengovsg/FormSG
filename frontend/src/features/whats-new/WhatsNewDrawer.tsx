import { useMemo, useState } from 'react'
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Stack,
  StackDivider,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import Button from '~components/Button'

import { FEATURE_UPDATE_LIST, FeatureUpdate } from './FeatureUpdateList'
import { WhatsNewContent } from './WhatsNewContent'

export type WhatsNewDrawerProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
>

const UNEXTENDED_LIST_LINK_TEXT = 'View all updates'
const EXTENDED_LIST_LINK_TEXT = 'Show less'
const DEFAULT_FEATURE_UPDATE_COUNT = 10

const showExtendListButton =
  FEATURE_UPDATE_LIST.features.length > DEFAULT_FEATURE_UPDATE_COUNT

export const WhatsNewDrawer = ({ isOpen, onClose }: WhatsNewDrawerProps) => {
  const [isListExtended, setIsListExtended] = useState<boolean>(false)

  const listOfFeatureUpdatesShown: FeatureUpdate[] = useMemo(() => {
    return isListExtended
      ? FEATURE_UPDATE_LIST.features
      : FEATURE_UPDATE_LIST.features.slice(0, DEFAULT_FEATURE_UPDATE_COUNT)
  }, [isListExtended])

  const handleOnViewAllUpdatesClick = () => {
    setIsListExtended(!isListExtended)
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="lg">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton
          variant="clear"
          colorScheme="secondary"
          top="1.25rem"
        />
        <DrawerHeader textStyle="h2" color="secondary.700">
          What's new
        </DrawerHeader>
        <DrawerBody
          whiteSpace="pre-wrap"
          color="secondary.500"
          textStyle="body-2"
        >
          <Stack divider={<StackDivider />} spacing="2rem" mb="2rem">
            {listOfFeatureUpdatesShown.map((featureUpdate, key) => {
              return <WhatsNewContent {...featureUpdate} key={key} />
            })}
            {showExtendListButton && (
              <Button
                variant="link"
                textDecoration="underline"
                alignSelf="center"
                onClick={handleOnViewAllUpdatesClick}
              >
                {isListExtended
                  ? EXTENDED_LIST_LINK_TEXT
                  : UNEXTENDED_LIST_LINK_TEXT}
              </Button>
            )}
          </Stack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

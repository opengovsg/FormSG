import { useState } from 'react'
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

export const WhatsNewDrawer = ({ isOpen, onClose }: WhatsNewDrawerProps) => {
  const [numberOfFeatureUpdatesShown, setNumberOfFeatureUpdatesShown] =
    useState<number>(DEFAULT_FEATURE_UPDATE_COUNT)
  const [linkText, setLinkText] = useState<string>(UNEXTENDED_LIST_LINK_TEXT)
  const [isListExtended, setIsListExtended] = useState<boolean>(false)

  const listOfFeatureUpdatesShown: FeatureUpdate[] = FEATURE_UPDATE_LIST.filter(
    (featureUpdate) => featureUpdate.id <= numberOfFeatureUpdatesShown,
  )

  const handleOnViewAllUpdatesClick = () => {
    setNumberOfFeatureUpdatesShown(
      isListExtended
        ? DEFAULT_FEATURE_UPDATE_COUNT
        : FEATURE_UPDATE_LIST.length,
    )
    setLinkText(
      isListExtended ? UNEXTENDED_LIST_LINK_TEXT : EXTENDED_LIST_LINK_TEXT,
    )
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
          What’s new
        </DrawerHeader>
        <DrawerBody
          whiteSpace="pre-line"
          color="secondary.500"
          textStyle="body-2"
        >
          <Stack divider={<StackDivider />} spacing="2rem" mb="2rem">
            {listOfFeatureUpdatesShown.map((featureUpdate, key) => {
              return <WhatsNewContent {...featureUpdate} key={key} />
            })}
            <Button
              variant="link"
              textDecoration="underline"
              alignSelf="center"
              onClick={handleOnViewAllUpdatesClick}
            >
              {linkText}
            </Button>
          </Stack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

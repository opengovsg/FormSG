import { useState } from 'react'
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Link,
  Stack,
  StackDivider,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { FeatureUpdate, FeatureUpdateList } from './FeatureUpdateList'
import { WhatsNewContent } from './WhatsNewContent'

export type WhatsNewDrawerProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
>

export const WhatsNewDrawer = ({ isOpen, onClose }: WhatsNewDrawerProps) => {
  const [numberOfFeatureUpdatesShown, setNumberOfFeatureUpdatesShown] =
    useState<number>(10)

  const listOfFeatureUpdatesShown: FeatureUpdate[] = FeatureUpdateList.filter(
    (featureUpdate) => featureUpdate.id <= numberOfFeatureUpdatesShown,
  )

  const handleOnViewAllUpdatesClick = () => {
    setNumberOfFeatureUpdatesShown(FeatureUpdateList.length)
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="lg">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton top="2rem" />
        <DrawerHeader
          textStyle="h2"
          fontSize="24px"
          paddingTop="2rem"
          paddingLeft="1.5rem"
        >
          What’s new
        </DrawerHeader>
        <DrawerBody
          py={0}
          px={0}
          mt="1.25rem"
          display="flex"
          alignItems="center"
          flexDirection="column"
        >
          <Stack divider={<StackDivider />} spacing="2rem">
            {listOfFeatureUpdatesShown.map((featureUpdate, key) => {
              return (
                <WhatsNewContent
                  date={featureUpdate.date}
                  title={featureUpdate.title}
                  description={featureUpdate.description}
                  imageUrl={featureUpdate.imageUrl}
                  key={key}
                />
              )
            })}
          </Stack>
          <Link mt="2rem" mb="5.75rem" onClick={handleOnViewAllUpdatesClick}>
            View all updates
          </Link>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

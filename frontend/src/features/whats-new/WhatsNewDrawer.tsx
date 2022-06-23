import { useState } from 'react'
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Link,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { FeatureUpdateList } from './test'
import { WhatsNewBlock } from './WhatsNewBlock'

export type WhatsNewDrawerProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
>

export const WhatsNewDrawer = ({ isOpen, onClose }: WhatsNewDrawerProps) => {
  const [numberOfFeatureUpdatesShown, setNumberOfFeatureUpdatesShown] =
    useState<number>(10)

  const listOfFeatureUpdatesShown = FeatureUpdateList.filter(
    (featureUpdate) =>
      parseInt(featureUpdate.id) <= numberOfFeatureUpdatesShown,
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
          {listOfFeatureUpdatesShown.map((featureUpdate, key) => {
            return (
              <WhatsNewBlock
                date={featureUpdate.date}
                title={featureUpdate.title}
                description={featureUpdate.description}
                imageUrl={featureUpdate.imageUrl}
                key={key}
              />
            )
          })}
          <Link mt="2rem" mb="5.75rem" onClick={handleOnViewAllUpdatesClick}>
            View all updates
          </Link>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

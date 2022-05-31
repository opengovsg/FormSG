import { useState } from 'react'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Box,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
} from '@chakra-ui/react'

import Button from '~components/Button'

import { LastFeatureContent } from './components/LastFeatureContent'
import { NewFeatureContent } from './components/NewFeatureContent'
import { ProgressIndicator } from './components/ProgressIndicator'
import { NEW_FEATURES, OTHER_UPDATES } from './Announcements'

interface RolloutAnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
}

export const RolloutAnnouncementModal = ({
  isOpen,
  onClose,
}: RolloutAnnouncementModalProps): JSX.Element => {
  const [currActiveIdx, setCurrActiveIdx] = useState<number>(0)

  const numOtherUpdatesPages = 1
  const NUM_NEW_FEATURES = NEW_FEATURES.length + numOtherUpdatesPages
  const isLastAnnouncement = currActiveIdx === NUM_NEW_FEATURES - 1

  const handleNextClick = (): void => {
    if (isLastAnnouncement) {
      onClose()
      return
    }

    setCurrActiveIdx(Math.min(currActiveIdx + 1, NUM_NEW_FEATURES - 1))
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={() => onClose()}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          {isLastAnnouncement ? (
            <LastFeatureContent updates={OTHER_UPDATES} />
          ) : (
            <NewFeatureContent content={NEW_FEATURES[currActiveIdx]} />
          )}
          <ModalFooter
            display="flex"
            justifyContent="space-between"
            paddingTop="2.5rem"
          >
            <ProgressIndicator
              numIndicators={NUM_NEW_FEATURES}
              currActiveIdx={currActiveIdx}
              onClick={setCurrActiveIdx}
            />
            <Box display="flex" alignItems="center" columnGap="2rem">
              <Text textStyle="subhead-1" cursor="pointer" onClick={onClose}>
                Cancel
              </Text>

              {isLastAnnouncement ? (
                <Button onClick={handleNextClick}>Done</Button>
              ) : (
                <Button
                  rightIcon={<BiRightArrowAlt size={24} />}
                  onClick={handleNextClick}
                >
                  Next
                </Button>
              )}
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

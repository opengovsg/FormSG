import { useState } from 'react'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
} from '@chakra-ui/react'

import Button from '~components/Button'

import { LastFeatureContent } from './components/LastFeatureContent'
import { NewFeatureContent } from './components/NewFeatureContent'
import { ProgressIndicator } from './components/ProgressIndicator'
import { NEW_FEATURES, OTHER_UPDATES } from './Announcements'

interface RolloutAnnouncementModalProps {
  isOpen: boolean
  onClose?: () => void
  onOpen?: () => void
}

export const RolloutAnnouncementModal = (
  props: RolloutAnnouncementModalProps,
): JSX.Element => {
  const { isOpen, onClose } = props
  const [currActiveIdx, setCurrActiveIdx] = useState<number>(0)

  const numOtherUpdatesPages = 1
  const NUM_NEW_FEATURES = NEW_FEATURES.length + numOtherUpdatesPages
  const isLastAnnouncement = currActiveIdx === NUM_NEW_FEATURES - 1

  const handleNextClick = (): void => {
    if (isLastAnnouncement) {
      onClose && onClose()
      return
    }

    setCurrActiveIdx(Math.min(currActiveIdx + 1, NUM_NEW_FEATURES - 1))
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={() => onClose && onClose()}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          {isLastAnnouncement ? (
            <LastFeatureContent updates={OTHER_UPDATES} />
          ) : (
            <NewFeatureContent content={NEW_FEATURES[currActiveIdx]} />
          )}
          <ModalFooter display="flex" justifyContent="space-between">
            <ProgressIndicator
              numIndicators={NUM_NEW_FEATURES}
              currActiveIdx={currActiveIdx}
              onClick={setCurrActiveIdx}
            />
            <Button onClick={handleNextClick}>
              {isLastAnnouncement ? 'Got it' : 'Next'}
              <BiRightArrowAlt size={22} />
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

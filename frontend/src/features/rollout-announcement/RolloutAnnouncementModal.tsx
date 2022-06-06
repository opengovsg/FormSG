import { useCallback, useMemo, useState } from 'react'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Flex,
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
  onClose: () => void
}

const NUM_OTHER_UPDATES_PAGES = 1
const NUM_NEW_FEATURES = NEW_FEATURES.length + NUM_OTHER_UPDATES_PAGES

export const RolloutAnnouncementModal = ({
  isOpen,
  onClose,
}: RolloutAnnouncementModalProps): JSX.Element => {
  const [currActiveIdx, setCurrActiveIdx] = useState<number>(0)
  const isLastAnnouncement = useMemo(
    () => currActiveIdx === NUM_NEW_FEATURES - 1,
    [currActiveIdx],
  )

  const handleNextClick = useCallback(() => {
    if (isLastAnnouncement) {
      onClose()
      return
    }

    setCurrActiveIdx(Math.min(currActiveIdx + 1, NUM_NEW_FEATURES - 1))
  }, [currActiveIdx, isLastAnnouncement, onClose])

  return (
    <Modal isOpen={isOpen} onClose={() => onClose()}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        {isLastAnnouncement ? (
          <LastFeatureContent updates={OTHER_UPDATES} />
        ) : (
          <NewFeatureContent content={NEW_FEATURES[currActiveIdx]} />
        )}
        <ModalFooter justifyContent="space-between">
          <ProgressIndicator
            numIndicators={NUM_NEW_FEATURES}
            currActiveIdx={currActiveIdx}
            onClick={setCurrActiveIdx}
          />
          <Flex gap="1rem">
            <Button onClick={onClose} variant="clear" colorScheme="secondary">
              Cancel
            </Button>

            {isLastAnnouncement ? (
              <Button onClick={handleNextClick}>Done</Button>
            ) : (
              <Button
                rightIcon={<BiRightArrowAlt size="1.5rem" />}
                onClick={handleNextClick}
              >
                Next
              </Button>
            )}
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

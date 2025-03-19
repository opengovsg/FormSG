import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { Button, Image, Stack, Text } from '@chakra-ui/react'

import { ProgressIndicator } from '~components/ProgressIndicator/ProgressIndicator'

interface ImageCarouselProps {
  images: string[]
  captions: string[]
}

export const ImageCarousel = ({ images, captions }: ImageCarouselProps) => {
  const { t } = useTranslation()
  const NUM_STEPS = images.length
  const [currentIndex, setCurrentIndex] = useState<number>(0)

  const nextItem = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1)
  }

  const prevItem = () => {
    setCurrentIndex((prevIndex) => prevIndex - 1)
  }

  return (
    <Stack
      spacing="1rem"
      alignItems="center"
      w="100%"
      flex="1"
      maxWidth="466px"
    >
      <Stack direction="row" w="100%" align="center">
        <Button
          borderRadius="full"
          padding="3px"
          width="20px"
          height="20px"
          minWidth="20px"
          minHeight="20px"
          display="flex"
          background="#DADCE3"
          onClick={prevItem}
          isDisabled={currentIndex <= 0}
        >
          <FaChevronLeft fontSize="0.7rem" color="#445072" />
        </Button>
        <Image
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          width="90%"
        />
        <Button
          borderRadius="full"
          padding="3px"
          width="20px"
          height="20px"
          minWidth="20px"
          minHeight="20px"
          display="flex"
          background="#DADCE3"
          onClick={nextItem}
          isDisabled={currentIndex >= NUM_STEPS - 1}
        >
          <FaChevronRight fontSize="0.7rem" color="#445072" />
        </Button>
      </Stack>
      <ProgressIndicator
        numIndicators={NUM_STEPS}
        currActiveIdx={currentIndex}
        onClick={() => {}}
      />
      <Text color="secondary.400" textStyle="caption-2">
        {captions[currentIndex]}
      </Text>
    </Stack>
  )
}

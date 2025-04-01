import { useState } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { Button, Flex, Image, Stack, Text } from '@chakra-ui/react'

import { ProgressIndicator } from '~components/ProgressIndicator/ProgressIndicator'

interface ImageCarouselProps {
  images: string[]
  captions: string[]
}

export const ImageCarousel = ({ images, captions }: ImageCarouselProps) => {
  const NUM_STEPS = images.length
  const [currentIndex, setCurrentIndex] = useState<number>(0)

  const nextItem = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1)
  }

  const prevItem = () => {
    setCurrentIndex((prevIndex) => prevIndex - 1)
  }

  const CarouselButton = ({
    onClick,
    isDisabled,
    icon,
  }: {
    onClick: () => void
    isDisabled: boolean
    icon: React.ReactNode
  }) => (
    <Button
      borderRadius="full"
      padding="3px"
      width="20px"
      height="20px"
      minWidth="20px"
      minHeight="20px"
      display="flex"
      backgroundColor="secondary.200"
      borderColor="secondary.200"
      _hover={{ bg: 'secondary.300' }}
      _disabled={{ bg: 'neutral.200', cursor: 'not-allowed' }}
      onClick={onClick}
      isDisabled={isDisabled}
      opacity={isDisabled ? 0 : 1}
      pointerEvents={isDisabled ? 'none' : 'auto'}
    >
      <Flex align="center" justify="center" width="100%" height="100%">
        {icon}
      </Flex>
    </Button>
  )

  return (
    <Stack
      spacing="1rem"
      alignItems="center"
      w="100%"
      flex="1"
      maxWidth="466px"
    >
      <Stack direction="row" w="100%" align="center">
        <CarouselButton
          onClick={prevItem}
          isDisabled={currentIndex <= 0}
          icon={<FaChevronLeft fontSize="0.7rem" color="#445072" />}
        />
        <Image
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          width="90%"
        />
        <CarouselButton
          onClick={nextItem}
          isDisabled={currentIndex >= NUM_STEPS - 1}
          icon={<FaChevronRight fontSize="0.7rem" color="#445072" />}
        />
      </Stack>
      <ProgressIndicator
        numIndicators={NUM_STEPS}
        currActiveIdx={currentIndex}
        onClick={setCurrentIndex}
      />
      <Text color="secondary.400" textStyle="caption-2">
        {captions[currentIndex]}
      </Text>
    </Stack>
  )
}

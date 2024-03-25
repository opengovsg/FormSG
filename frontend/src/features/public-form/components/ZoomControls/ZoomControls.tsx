import { Divider, HStack, IconButton } from '@chakra-ui/react'

import { FontDefaultSvgr } from './FontDefaultSvgr'
import { FontLargestSvgr } from './FontLargestSvgr'
import { FontLargeSvgr } from './FontLargeSvgr'

export const ZoomControls = ({
  setDefaultSize,
  setLargeSize,
  setLargestSize,
}): JSX.Element => {
  return (
    <HStack
      background="white"
      shadow="md"
      width="9.75rem"
      height="3.25rem"
      padding="0.5rem"
      mt="1.375rem"
      mb="-4.625rem"
      spacing="0.5rem"
      borderRadius="md"
      zIndex={1}
    >
      <IconButton
        size="smd"
        variant="clear"
        aria-label="Default font size"
        icon={<FontDefaultSvgr />}
        onClick={setDefaultSize}
      />
      <Divider orientation="vertical" height="1.5rem" />
      <IconButton
        size="smd"
        variant="clear"
        aria-label="Larger font size"
        icon={<FontLargeSvgr />}
        onClick={setLargeSize}
      />
      <Divider orientation="vertical" height="1.5rem" />
      <IconButton
        size="smd"
        variant="clear"
        aria-label="Largest font size"
        icon={<FontLargestSvgr />}
        onClick={setLargestSize}
      />
    </HStack>
  )
}

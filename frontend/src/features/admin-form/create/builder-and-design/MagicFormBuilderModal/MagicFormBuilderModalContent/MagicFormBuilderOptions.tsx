import { BiFileBlank, BiPencil } from 'react-icons/bi'
import { forwardRef, Stack } from '@chakra-ui/react'

import { MagicFormBuilderMode } from '~shared/types/form/form'

import Tile from '~components/Tile'

export interface MagicFormBuilderOptionsProps {
  onChange: (option: MagicFormBuilderMode) => void
  value: MagicFormBuilderMode
}

export const MagicFormBuilderOptions = forwardRef<
  MagicFormBuilderOptionsProps,
  'button'
>(({ value, onChange }, ref) => {
  return (
    <Stack spacing="1rem" w="100%" direction={{ base: 'column', md: 'row' }}>
      <Tile
        variant="complex"
        icon={BiFileBlank}
        isActive={value === MagicFormBuilderMode.Pdf}
        onClick={() => onChange(MagicFormBuilderMode.Pdf)}
        isFullWidth
        flex={1}
      >
        <Tile.Title>Upload a form</Tile.Title>
        <Tile.Subtitle>Convert a PDF form</Tile.Subtitle>
      </Tile>
      <Tile
        ref={ref}
        variant="complex"
        icon={BiPencil}
        isActive={value === MagicFormBuilderMode.Prompt}
        onClick={() => onChange(MagicFormBuilderMode.Prompt)}
        isFullWidth
        flex={1}
      >
        <Tile.Title>Write a prompt</Tile.Title>
        <Tile.Subtitle>Build a form based on a prompt</Tile.Subtitle>
      </Tile>
    </Stack>
  )
})

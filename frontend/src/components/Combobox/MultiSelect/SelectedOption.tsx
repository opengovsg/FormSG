import { BiX } from 'react-icons/bi'
import { Icon, Tag, TagCloseButton, TagLabel } from '@chakra-ui/react'

export interface SelectedOptionProps {
  label: string
  onRemove: () => void
}

export const SelectedOption = ({
  label,
  onRemove,
}: SelectedOptionProps): JSX.Element => {
  // TODO: Update Tag global theme instead of styling it in this component.
  return (
    <Tag
      colorScheme="secondary"
      px="0.5rem"
      py="0.375rem"
      color="secondary.500"
    >
      <TagLabel textStyle="body-2">{label}</TagLabel>
      <TagCloseButton
        onClick={onRemove}
        opacity={0.8}
        color="secondary.500"
        _focus={{
          boxShadow: '0 0 0 2px var(--chakra-colors-secondary-300)',
          bg: 'secondary.200',
        }}
        _hover={{ opacity: 0.9, color: 'secondary.600' }}
        _active={{ opacity: 1, color: 'secondary.700', bg: 'secondary.200' }}
      >
        <Icon as={BiX} fontSize="1.5rem" />
      </TagCloseButton>
    </Tag>
  )
}

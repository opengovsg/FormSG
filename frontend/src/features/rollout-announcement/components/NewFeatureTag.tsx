import { IoRocketSharp } from 'react-icons/io5'
import { TagLabel } from '@chakra-ui/react'

import { Tag, TagLeftIcon } from '~components/Tag'

export const NewFeatureTag = (): JSX.Element => {
  return (
    <Tag
      _hover={{ backgroundColor: 'primary.100' }}
      _active={{ backgroundColor: 'primary.100' }}
    >
      <TagLeftIcon as={IoRocketSharp} color="secondary.500" />
      <TagLabel color="secondary.500" textStyle={'caption-1'}>
        New feature
      </TagLabel>
    </Tag>
  )
}

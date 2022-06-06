import { IoRocketSharp } from 'react-icons/io5'
import { Icon, Text } from '@chakra-ui/react'

import Badge from '~components/Badge'

export const NewFeatureTag = (): JSX.Element => {
  return (
    <Badge
      variant="subtle"
      display="inline-flex"
      columnGap="0.5rem"
      alignItems="center"
    >
      <Icon as={IoRocketSharp} color="secondary.500" />
      <Text color="secondary.500" textStyle={'caption-1'}>
        New feature
      </Text>
    </Badge>
  )
}

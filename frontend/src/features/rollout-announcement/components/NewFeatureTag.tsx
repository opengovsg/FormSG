import { Icon, Text } from '@chakra-ui/react'

import { BxsRocket } from '~assets/icons'
import Badge from '~components/Badge'

export const NewFeatureTag = (): JSX.Element => {
  return (
    <Badge
      variant="subtle"
      display="inline-flex"
      columnGap="0.5rem"
      alignItems="center"
      color="secondary.500"
    >
      <Icon as={BxsRocket} />
      <Text textStyle="caption-1">New feature</Text>
    </Badge>
  )
}

import { Icon } from '@chakra-ui/react'
import { Badge } from '@opengovsg/design-system-react'

import { BxsRocket } from '~assets/icons'

export const NewFeatureTag = (): JSX.Element => {
  return (
    <Badge
      variant="subtle"
      display="inline-flex"
      columnGap="0.5rem"
      alignItems="center"
      colorScheme="sub"
    >
      <Icon as={BxsRocket} />
      New feature
    </Badge>
  )
}

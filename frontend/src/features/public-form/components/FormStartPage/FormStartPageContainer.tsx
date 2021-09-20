import { Box } from '@chakra-ui/layout'

import { FormBannerLogo } from './FormBannerLogo'
import { FormTitle } from './FormTitle'

export const FormStartPageContainer = (): JSX.Element => {
  return (
    <Box>
      <FormBannerLogo />
      <FormTitle />
    </Box>
  )
}

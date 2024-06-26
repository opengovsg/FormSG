import { Text } from '@chakra-ui/react'

import { SINGPASS_PARTNER_SUPPORT_LINK } from '~shared/constants/links'
import { FormAuthType } from '~shared/types/form'

import Link from '~components/Link'

interface EsrvcHelperTextProps {
  authType: FormAuthType
}

export const EsrvcHelperText = ({
  authType,
}: EsrvcHelperTextProps): JSX.Element => {
  switch (authType) {
    case FormAuthType.SP:
    case FormAuthType.CP:
    case FormAuthType.MyInfo:
      return (
        <Text textStyle="body-2" color="secondary.400">
          Contact{' '}
          <Link isExternal href={SINGPASS_PARTNER_SUPPORT_LINK}>
            Singpass partner support
          </Link>{' '}
          for your e-Service ID
        </Text>
      )
    default:
      return <></>
  }
}

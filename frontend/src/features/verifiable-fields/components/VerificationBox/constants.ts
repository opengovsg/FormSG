import { ChakraComponent } from '@chakra-ui/react'

import { BasicField } from '~shared/types/field'

import { VerifiableFieldType } from '~features/verifiable-fields/types'

import { EmailOtpSvgr } from './EmailOtpSvgr'
import { MobileOtpSvgr } from './MobileOtpSvgr'

type VerificationBoxRenderData = {
  logo: ChakraComponent<(props: React.SVGProps<SVGSVGElement>) => JSX.Element>
  header: string
  subheader: string
}

export const VFN_RENDER_DATA: Record<
  VerifiableFieldType,
  VerificationBoxRenderData
> = {
  [BasicField.Mobile]: {
    logo: MobileOtpSvgr,
    header: 'Verify your mobile number',
    subheader:
      'An SMS with a 6-digit verification code was sent to you. It will be valid for 30 minutes.',
  },
  [BasicField.Email]: {
    logo: EmailOtpSvgr,
    header: 'Verify your email',
    subheader:
      'An email with a 6-digit verification code was sent to you. It will be valid for 30 minutes.',
  },
}

import { ChakraComponent } from '@chakra-ui/react'

import { BasicField } from '~shared/types/field'

import { VerifiableFieldType } from '../types'

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
      'An SMS with a 6-digit verification code was sent to you. It will be valid for 10 minutes.',
  },
  [BasicField.Email]: {
    // TODO: Update to EmailOtpIcon
    logo: MobileOtpSvgr,
    header: 'Verify your email',
    subheader:
      'An email with a 6-digit verification code was sent to you. It will be valid for 10 minutes.',
  },
}

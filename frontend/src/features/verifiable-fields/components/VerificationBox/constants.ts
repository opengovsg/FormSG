import { ChakraComponent } from '@chakra-ui/react'

import { Language } from '~shared/types'
import { BasicField } from '~shared/types/field'

import { VerifiableFieldType } from '~features/verifiable-fields/types'

import { EmailOtpSvgr } from './EmailOtpSvgr'
import { MobileOtpSvgr } from './MobileOtpSvgr'

type VerificationBoxRenderData = {
  logo: ChakraComponent<(props: React.SVGProps<SVGSVGElement>) => JSX.Element>
  header: Record<Language, string>
  subheader: Record<Language, string>
}

export const VFN_RENDER_DATA: Record<
  VerifiableFieldType,
  VerificationBoxRenderData
> = {
  [BasicField.Mobile]: {
    logo: MobileOtpSvgr,
    header: {
      [Language.ENGLISH]: 'Verify your mobile number',
      [Language.CHINESE]: '验证您的手机号码',
      [Language.MALAY]: 'Sahkan nombor telefon bimbit anda',
      [Language.TAMIL]: 'உங்கள் மொபைல் எண்ணைச் சரிபார்க்கவும்',
    },
    subheader: {
      [Language.ENGLISH]:
        'An SMS with a 6-digit verification code was sent to you. It will be valid for 30 minutes.',
      [Language.CHINESE]: '已通过短信发送6 位数的验证码，30分钟内有效。',
      [Language.MALAY]:
        'SMS dengan kod pengesahan 6 digit telah dihantar kepada anda. Kod itu sah selama 30 minit. ',
      [Language.TAMIL]:
        '6 இலக்க சரிபார்ப்புக் குறியீடு கொண்ட எஸ்எம்எஸ் உங்களுக்கு அனுப்பப்பட்டுள்ளது. 30 நிமிடங்களுக்கு இது செல்லுபடியாகும்.',
    },
  },
  [BasicField.Email]: {
    logo: EmailOtpSvgr,
    header: {
      [Language.ENGLISH]: 'Verify your email',
      [Language.CHINESE]: '验证您的电子邮箱',
      [Language.MALAY]: 'Sahkan e-mel anda',
      [Language.TAMIL]: 'உங்கள் மின்னஞ்சல் முகவரியைச் சரிபார்க்கவும்',
    },
    subheader: {
      [Language.ENGLISH]:
        'An email with a 6-digit verification code was sent to you. It will be valid for 30 minutes.',
      [Language.CHINESE]: '已通过电邮发送6位数的验证码，30分钟内有效。',
      [Language.MALAY]:
        'E-mel dengan kod pengesahan 6 digit telah dihantar kepada anda. Kod itu sah selama 30 minit. ',
      [Language.TAMIL]: 'மின்னஞ்சல் முகவரியை சரிபார்க்கவும்',
    },
  },
}

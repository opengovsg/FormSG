import { useTranslation } from 'react-i18next'
import { IoMdCloseCircle } from 'react-icons/io'
import { Flex, Icon, Text } from '@chakra-ui/react'

import Link from '~components/Link'

export const ContactSupportMessage = (): JSX.Element => {
  const { t } = useTranslation()
  const textColor = 'secondary.500'
  return (
    <Flex mt="1rem" color={textColor}>
      <Icon as={IoMdCloseCircle} mr="0.5rem" />
      <Text textStyle="caption-1">
        {t(
          'features.adminForm.sidebar.fields.mobileNo.otpVerification.thresholdWarning',
        )}{' '}
        <Link
          textStyle="caption-1"
          href={'https://go.gov.sg/form-support'}
          isExternal
        >
          {t(
            'features.adminForm.sidebar.fields.mobileNo.otpVerification.contact',
          )}
        </Link>
      </Text>
    </Flex>
  )
}

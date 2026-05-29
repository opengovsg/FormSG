import { Trans, useTranslation } from 'react-i18next'
import { Text } from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types/form'

interface FormAuthMessageProps {
  authType: Exclude<FormAuthType, FormAuthType.NIL>
  isSubmitterIdCollectionEnabled: boolean
}

const SubmitterIdCollectionInfoText = ({
  authType,
  isSubmitterIdCollectionEnabled,
}: FormAuthMessageProps): JSX.Element => {
  const isCorporate = authType === FormAuthType.CP

  const keyBase = isSubmitterIdCollectionEnabled ? 'included' : 'notIncluded'
  const key = isCorporate ? 'corporate' : 'singpass'

  return (
    <Text>
      <Trans
        i18nKey={`features.publicForm.components.formAuthMessage.submitterId.${keyBase}.${key}`}
        components={{ bold: <Text as="b" /> }}
      />
    </Text>
  )
}

const getSignInText = (
  authType: Exclude<FormAuthType, FormAuthType.NIL>,
  t: (key: string) => string,
) => {
  switch (authType) {
    case FormAuthType.MyInfo:
      return t('features.publicForm.components.formAuthMessage.signIn.singpass')
    case FormAuthType.CP:
      return t(
        'features.publicForm.components.formAuthMessage.signIn.corporate',
      )
    default: {
      const _: never = authType
      throw new Error('Invalid auth type')
    }
  }
}

export const FormAuthMessage = ({
  authType,
  isSubmitterIdCollectionEnabled,
}: FormAuthMessageProps) => {
  const { t } = useTranslation()
  const signInText = getSignInText(authType, t)

  return (
    <Text
      textStyle="body-2"
      color="secondary.500"
      textAlign="center"
      whiteSpace="pre-wrap"
    >
      {signInText}
      <SubmitterIdCollectionInfoText
        authType={authType}
        isSubmitterIdCollectionEnabled={isSubmitterIdCollectionEnabled}
      />
    </Text>
  )
}

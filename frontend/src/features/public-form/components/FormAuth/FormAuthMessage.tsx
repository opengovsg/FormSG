import { Text } from '@chakra-ui/react'

import { FormAuthType } from '~shared/types/form'

interface FormAuthMessageProps {
  authType: Exclude<FormAuthType, FormAuthType.NIL>
  isSubmitterIdCollectionEnabled: boolean
}

const SubmitterIdCollectionInfoText = ({
  authType,
  isSubmitterIdCollectionEnabled,
}: FormAuthMessageProps): JSX.Element => {
  if (isSubmitterIdCollectionEnabled) {
    switch (authType) {
      case FormAuthType.SP:
      case FormAuthType.MyInfo:
      case FormAuthType.SGID:
      case FormAuthType.SGID_MyInfo:
        return (
          <Text>
            Your Singpass login ID <Text as="b">will be included</Text> with
            your form submission.
          </Text>
        )
      case FormAuthType.CP:
        return (
          <Text>
            Your Singpass and Corppass login ID{' '}
            <Text as="b">will be included</Text> with your form submission.
          </Text>
        )
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = authType
        throw new Error('Invalid auth type')
      }
    }
  } else {
    switch (authType) {
      case FormAuthType.SP:
      case FormAuthType.MyInfo:
      case FormAuthType.SGID:
      case FormAuthType.SGID_MyInfo:
        return (
          <Text>
            Your Singpass login ID will <Text as="b">not be included</Text> with
            your form submission.
          </Text>
        )
      case FormAuthType.CP:
        return (
          <Text>
            Your Singpass and Corppass login ID will{' '}
            <Text as="b">not be included</Text> with your form submission.
          </Text>
        )
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = authType
        throw new Error('Invalid auth type')
      }
    }
  }
}

const getSignInText = (authType: Exclude<FormAuthType, FormAuthType.NIL>) => {
  switch (authType) {
    case FormAuthType.SP:
    case FormAuthType.MyInfo:
      return 'Sign in with Singpass to access this form.\n'
    case FormAuthType.CP:
      return 'Corporate entity login is required for this form.\n'
    case FormAuthType.SGID:
    case FormAuthType.SGID_MyInfo:
      return 'Sign in with the Singpass app to access this form.\n'
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = authType
      throw new Error('Invalid auth type')
    }
  }
}

export const FormAuthMessage = ({
  authType,
  isSubmitterIdCollectionEnabled,
}: FormAuthMessageProps) => {
  const signInText = getSignInText(authType)

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

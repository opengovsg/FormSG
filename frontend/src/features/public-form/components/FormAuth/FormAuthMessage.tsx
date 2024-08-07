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
            Your Singpass login ID and corporate Entity login ID{' '}
            <Text as="b">will be included</Text> with your form submission.
          </Text>
        )
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
            Your Singpass login ID and Corporate Entity login ID will{' '}
            <Text as="b">not be included</Text> with your form submission.
          </Text>
        )
    }
  }
}

export const FormAuthMessage = ({
  authType,
  isSubmitterIdCollectionEnabled,
}: FormAuthMessageProps) => {
  const signInText = (() => {
    switch (authType) {
      case FormAuthType.SP:
      case FormAuthType.MyInfo:
        return 'Sign in with Singpass to access this form.\n'
      case FormAuthType.CP:
        return 'Corporate entity login is required for this form.\n'
      case FormAuthType.SGID:
      case FormAuthType.SGID_MyInfo:
        return 'Sign in with the Singpass app to access this form.\n'
    }
  })()

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

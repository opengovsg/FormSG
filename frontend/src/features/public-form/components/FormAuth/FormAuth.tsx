import { useMemo } from 'react'
import { BiLogInCircle } from 'react-icons/bi'
import { Box, Stack, Text } from '@chakra-ui/react'

import { FormAuthType } from '~shared/types/form'

import Button from '~components/Button'

import { usePublicAuthMutations } from '~features/public-form/mutations'

import { AuthImageSvgr } from './AuthImageSvgr'

export interface FormAuthProps {
  authType: Exclude<FormAuthType, FormAuthType.NIL>
}

export const FormAuth = ({ authType }: FormAuthProps): JSX.Element => {
  const displayedInfo = useMemo(() => {
    switch (authType) {
      case FormAuthType.SP:
      case FormAuthType.MyInfo:
        return {
          authType: 'Singpass',
          helpText:
            'Sign in with Singpass to access this form.\nYour Singpass ID will be included with your form submission.',
        }
      case FormAuthType.CP:
        return {
          authType: 'Singpass (Corporate)',
          helpText:
            'Corporate entity login is required for this form.\nYour Singpass ID and corporate Entity ID will be included with your form submission.',
        }
      case FormAuthType.SGID:
        return {
          authType: 'Singpass app',
          helpText:
            'Sign in with the Singpass app to access this form.\nYour Singpass ID will be included with your form submission.',
        }
    }
  }, [authType])

  const { handleLoginMutation } = usePublicAuthMutations()

  return (
    <Stack spacing="1.5rem" align="center">
      <AuthImageSvgr />
      <Box>
        <Button
          rightIcon={<BiLogInCircle fontSize="1.5rem" />}
          onClick={() => handleLoginMutation.mutate()}
          isLoading={handleLoginMutation.isLoading}
        >
          Log in with {displayedInfo.authType}
        </Button>
      </Box>
      <Text
        textStyle="body-2"
        color="secondary.500"
        textAlign="center"
        whiteSpace="pre-line"
      >
        {displayedInfo.helpText}
      </Text>
    </Stack>
  )
}

import { useMemo } from 'react'
import { BiLogInCircle } from 'react-icons/bi'
import { Box, Stack } from '@chakra-ui/react'

import {
  FORM_RESPONDENT_NOT_WHITELISTED_ERROR_MESSAGE,
  FORM_SINGLE_SUBMISSION_VALIDATION_ERROR_MESSAGE,
} from '~shared/constants'
import { FormAuthType } from '~shared/types/form'

import InlineMessage from '~/components/InlineMessage'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { usePublicAuthMutations } from '~features/public-form/mutations'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { AuthImageSvgr } from './AuthImageSvgr'
import { FormAuthMessage } from './FormAuthMessage'

const getDispayedAuthTypeText = (
  authType: Exclude<FormAuthType, FormAuthType.NIL>,
) => {
  switch (authType) {
    case FormAuthType.SP:
    case FormAuthType.MyInfo:
      return 'Singpass'
    case FormAuthType.CP:
      return 'Singpass (Corporate)'
    case FormAuthType.SGID:
    case FormAuthType.SGID_MyInfo:
      return 'Singpass app'
  }
}

export interface FormAuthProps {
  authType: Exclude<FormAuthType, FormAuthType.NIL>
  isSubmitterIdCollectionEnabled: boolean
  hasSingleSubmissionValidationError: boolean
  hasRespondentNotWhitelistedError: boolean
}

export const FormAuth = ({
  authType,
  isSubmitterIdCollectionEnabled,
  hasSingleSubmissionValidationError,
  hasRespondentNotWhitelistedError,
}: FormAuthProps): JSX.Element => {
  const { formId, form } = usePublicFormContext()

  const buttonColorScheme = useMemo(() => {
    if (!form) return
    return `theme-${form.startPage.colorTheme}` as const
  }, [form])

  const isMobile = useIsMobile()
  const { handleLoginMutation } = usePublicAuthMutations(formId)
  const displayedAuthTypeText = getDispayedAuthTypeText(authType)

  return (
    <Box
      bg="white"
      mt={{ base: '1.5rem', md: 0 }}
      mb="1.5rem"
      py="4rem"
      px={{ base: '1.5rem', md: '2.5rem' }}
    >
      <Stack spacing="1.5rem" align="center">
        <AuthImageSvgr />
        <Button
          colorScheme={buttonColorScheme}
          isFullWidth={isMobile}
          rightIcon={isMobile ? undefined : <BiLogInCircle fontSize="1.5rem" />}
          onClick={() => handleLoginMutation.mutate()}
          isLoading={handleLoginMutation.isLoading}
        >
          Log in with {displayedAuthTypeText}
        </Button>
        <FormAuthMessage
          isSubmitterIdCollectionEnabled={isSubmitterIdCollectionEnabled}
          authType={authType}
        />
        {hasSingleSubmissionValidationError ? (
          <InlineMessage variant="error">
            {FORM_SINGLE_SUBMISSION_VALIDATION_ERROR_MESSAGE}
          </InlineMessage>
        ) : null}
        {hasRespondentNotWhitelistedError ? (
          <InlineMessage variant="error">
            {FORM_RESPONDENT_NOT_WHITELISTED_ERROR_MESSAGE}
          </InlineMessage>
        ) : null}
      </Stack>
    </Box>
  )
}

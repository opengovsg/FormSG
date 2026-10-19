import { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link as ReactLink } from 'react-router-dom'
import { Box, Text } from '@chakra-ui/react'
import { Droppable } from '@hello-pangea/dnd'

import {
  getLoginIdentityAttrsForAuthType,
  LoginIdentityAttribute,
} from 'formsg-shared/utils/login-identity'

import { ADMINFORM_SETTINGS_SINGPASS_SUBROUTE } from '~constants/routes'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

import { useCreateTabForm } from '../../../useCreateTabForm'
import { DraggableLoginIdentityFieldListOption } from '../FieldListOption'

import { FieldSection } from './FieldSection'
import { useLoginFieldLimit } from './useLoginFieldLimit'
import { useOfferedLoginIdentityAttrs } from './useOfferedLoginIdentityAttrs'

// Trans fills in the link text from the translation.
const SettingsLink = ({ children }: { children?: ReactNode }) => (
  <Link as={ReactLink} to={ADMINFORM_SETTINGS_SINGPASS_SUBROUTE}>
    {children}
  </Link>
)

const ConvertFirstText = () => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.loginIdentity',
  })
  return (
    <Trans
      t={t}
      i18nKey="convertFirst"
      components={{ settingsLink: <SettingsLink /> }}
    />
  )
}

const MessageBox = ({
  children,
  variant = 'info',
}: {
  children: ReactNode
  variant?: 'info' | 'error'
}) => (
  <Box px="1.5rem" pt="2rem" pb="1.5rem">
    <InlineMessage variant={variant}>
      <Text>{children}</Text>
    </InlineMessage>
  </Box>
)

/** The shared MyInfo and identity field limit, with the form's usage. */
export const LoginFieldLimitText = (): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.loginIdentity',
  })
  const { count, max } = useLoginFieldLimit()
  return <>{t('fieldLimit', { count, max })}</>
}

/** The info box at the top of a login's field panel, like the MyInfo panel's. */
export const LoginIdentityMessage = ({
  attrs,
  loginName,
  info,
}: {
  attrs: LoginIdentityAttribute[]
  loginName: string
  info: string
}): JSX.Element | null => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.loginIdentity',
  })
  const { data: form } = useCreateTabForm()
  const { isAtLimit } = useLoginFieldLimit()
  if (!form) return null

  const isLoginMissing = !getLoginIdentityAttrsForAuthType(
    form.authType,
  ).includes(attrs[0])
  const isConvertFirst = !isLoginMissing && form.isSubmitterIdCollectionEnabled

  return (
    <MessageBox
      variant={
        isAtLimit && !isLoginMissing && !isConvertFirst ? 'error' : 'info'
      }
    >
      {isLoginMissing ? (
        <Trans
          t={t}
          i18nKey="loginMissing"
          values={{ loginName }}
          components={{ settingsLink: <SettingsLink /> }}
        />
      ) : isConvertFirst ? (
        <ConvertFirstText />
      ) : (
        <>
          {info} <LoginFieldLimitText />
        </>
      )}
    </MessageBox>
  )
}

export const LoginIdentityFieldSection = ({
  attrs,
  droppableId,
  searchValue,
  withSectionLabel = true,
  showConvertFirst = false,
}: {
  // Fixed order: the drop handler reads the dragged attr by this index.
  attrs: LoginIdentityAttribute[]
  droppableId: string
  searchValue: string
  withSectionLabel?: boolean
  showConvertFirst?: boolean
}): JSX.Element | null => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields.loginIdentity',
  })
  const { data: form, isLoading } = useCreateTabForm()
  const { isAtLimit } = useLoginFieldLimit()

  const filteredAttrs = useOfferedLoginIdentityAttrs(attrs, searchValue)
  if (!form || filteredAttrs.length === 0) return null

  const isLoginMissing = !getLoginIdentityAttrsForAuthType(
    form.authType,
  ).includes(attrs[0])
  const isCollectedBySettings = form.isSubmitterIdCollectionEnabled
  const isSectionDisabled =
    isLoading || isLoginMissing || isCollectedBySettings || isAtLimit

  const options = filteredAttrs.map(({ attr, originalIndex }) => (
    <DraggableLoginIdentityFieldListOption
      key={attr}
      index={originalIndex}
      attr={attr}
      isDisabled={isSectionDisabled}
    />
  ))

  return (
    <Droppable isDropDisabled droppableId={droppableId}>
      {(provided) => (
        <Box ref={provided.innerRef} {...provided.droppableProps}>
          {showConvertFirst && isCollectedBySettings && !isLoginMissing && (
            <MessageBox>
              <ConvertFirstText />
            </MessageBox>
          )}
          {withSectionLabel ? (
            <FieldSection label={t('sectionLabel')}>{options}</FieldSection>
          ) : (
            options
          )}
          <Box display="none">{provided.placeholder}</Box>
        </Box>
      )}
    </Droppable>
  )
}

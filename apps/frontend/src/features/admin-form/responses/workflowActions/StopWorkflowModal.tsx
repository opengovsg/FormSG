import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl, FormErrorMessage } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import { MultirespondentFormSettings } from 'formsg-shared/types/form'

import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { WorkflowActionModal } from './WorkflowActionModal'

const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.stopModal` as const

export interface StopWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (notifiedEmails: string[]) => void
  isLoading?: boolean
}

export const StopWorkflowModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: StopWorkflowModalProps): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings } = useAdminFormSettings<MultirespondentFormSettings>()
  const [emails, setEmails] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) setEmails(settings?.emails ?? [])
  }, [isOpen, settings])

  const entered = Array.from(
    new Set(emails.map((email) => email.trim().toLowerCase())),
  )
  const error = entered.some((email) => !isEmail(email))
    ? t(`${WORKFLOW_ACTIONS_I18N}.addAssigneeModal.invalidEmail`)
    : undefined

  return (
    <WorkflowActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t(`${I18N_PREFIX}.title`)}
      description={t(`${I18N_PREFIX}.description`)}
      isBeta
      confirmLabel={t(`${I18N_PREFIX}.confirm`)}
      confirmColorScheme="danger"
      isConfirmDisabled={!!error}
      isConfirmLoading={isLoading}
      onConfirm={() => onConfirm(entered)}
    >
      <FormControl isInvalid={!!error}>
        <FormLabel>{t(`${I18N_PREFIX}.label`)}</FormLabel>
        <TagInput
          value={emails}
          onChange={(values) =>
            setEmails(values.filter((value) => value.trim() !== ''))
          }
          placeholder={emails.length > 0 ? undefined : 'me@example.com'}
          tagValidation={isEmail}
        />
        {error ? (
          <FormErrorMessage>{error}</FormErrorMessage>
        ) : (
          <FormLabel.Description color="secondary.400" mt="0.5rem">
            {t(
              'features.adminForm.settings.emailNotifications.section.mrf.respondents.others.descriptionRedesign',
            )}
          </FormLabel.Description>
        )}
      </FormControl>
    </WorkflowActionModal>
  )
}

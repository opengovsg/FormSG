import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl, FormErrorMessage } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { formatEmailList } from './formatEmailList'
import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { WorkflowActionModal } from './WorkflowActionModal'

const I18N_PREFIX = `${WORKFLOW_ACTIONS_I18N}.addAssigneeModal` as const

export interface AddAssigneeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (emails: string[]) => void
  isLoading?: boolean
  currentAssignees: string[]
}

export const AddAssigneeModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  currentAssignees,
}: AddAssigneeModalProps): JSX.Element => {
  const { t } = useTranslation()
  const [emails, setEmails] = useState<string[]>([])
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setEmails([])
      setHasAttemptedSubmit(false)
    }
  }, [isOpen])

  const entered = Array.from(
    new Set(emails.map((email) => email.trim().toLowerCase())),
  )
  const assigned = new Set(currentAssignees.map((email) => email.toLowerCase()))
  const alreadyAssigned = entered.filter((email) => assigned.has(email))
  const toAdd = entered.filter(
    (email) => isEmail(email) && !assigned.has(email),
  )
  const validationError = entered.some((email) => !isEmail(email))
    ? t(`${I18N_PREFIX}.invalidEmail`)
    : alreadyAssigned.length > 0
      ? t(`${I18N_PREFIX}.alreadyAssigned`, {
          emails: formatEmailList(alreadyAssigned),
          count: alreadyAssigned.length,
        })
      : undefined
  const error =
    validationError ??
    (hasAttemptedSubmit && entered.length === 0
      ? t(`${I18N_PREFIX}.requiredEmail`)
      : undefined)

  const handleConfirm = () => {
    if (isLoading) return
    setHasAttemptedSubmit(true)
    if (toAdd.length === 0 || validationError) return
    onConfirm(toAdd)
  }

  return (
    <WorkflowActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t(`${I18N_PREFIX}.title`)}
      description={t(`${I18N_PREFIX}.description`)}
      isBeta
      confirmLabel={t(`${I18N_PREFIX}.confirm`)}
      isConfirmDisabled={!!validationError}
      isConfirmLoading={isLoading}
      onConfirm={handleConfirm}
    >
      <FormControl isInvalid={!!error}>
        <FormLabel isRequired>{t(`${I18N_PREFIX}.label`)}</FormLabel>
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

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl, FormErrorMessage } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { formatEmailList } from './formatEmailList'
import { WORKFLOW_STOP_I18N } from './i18n'
import { WorkflowActionModal } from './WorkflowActionModal'

const I18N_PREFIX = `${WORKFLOW_STOP_I18N}.addAssigneeModal` as const

export interface AddAssigneeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (emails: string[]) => void
  /** Everyone already assigned to the pending step. */
  currentAssignees: string[]
}

/**
 * Adds people to the pending step. Add-only by design: a step link carries the
 * submission's decryption key, so a removed assignee could still read the
 * response. Removing would give a false sense that access was revoked.
 */
export const AddAssigneeModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentAssignees,
}: AddAssigneeModalProps): JSX.Element => {
  const { t } = useTranslation()
  const [emails, setEmails] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) setEmails([])
  }, [isOpen])

  const entered = Array.from(
    new Set(emails.map((email) => email.trim().toLowerCase())),
  )
  const assigned = new Set(currentAssignees.map((email) => email.toLowerCase()))
  const alreadyAssigned = entered.filter((email) => assigned.has(email))
  const toAdd = entered.filter(
    (email) => isEmail(email) && !assigned.has(email),
  )
  const error = entered.some((email) => !isEmail(email))
    ? t(`${I18N_PREFIX}.invalidEmail`)
    : alreadyAssigned.length > 0
      ? t(`${I18N_PREFIX}.alreadyAssigned`, {
          emails: formatEmailList(alreadyAssigned),
          count: alreadyAssigned.length,
        })
      : undefined

  return (
    <WorkflowActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t(`${I18N_PREFIX}.title`)}
      description={t(`${I18N_PREFIX}.description`)}
      isBeta
      // Valid new addresses show even while another entry has an error; the
      // confirm button stays disabled until it is fixed.
      notifiedEmails={toAdd}
      confirmLabel={t(`${I18N_PREFIX}.confirm`)}
      isConfirmDisabled={toAdd.length === 0 || !!error}
      onConfirm={() => onConfirm(toAdd)}
    >
      <FormControl isInvalid={!!error}>
        <FormLabel isRequired>{t(`${I18N_PREFIX}.label`)}</FormLabel>
        <TagInput
          value={emails}
          // Ignore empty entries, e.g. from a trailing comma.
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

import { useTranslation } from 'react-i18next'
import { ModalBody, ModalHeader, Stack } from '@chakra-ui/react'

import { useAdminFormCollaborators } from '~features/admin-form/common/queries'

import { useCollaboratorWizard } from '../CollaboratorWizardContext'

import { AddCollaboratorInput } from './AddCollaboratorInput'
import { CollaboratorList } from './CollaboratorList'

export const CollaboratorListScreen = (): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.collaborator',
  })
  const { formId } = useCollaboratorWizard()
  const { hasEditAccess } = useAdminFormCollaborators(formId)
  return (
    <>
      <ModalHeader color="secondary.700">
        {hasEditAccess ? t('list.header.manage') : t('list.header.view')}
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Stack spacing="2.5rem" pb="2rem">
          {hasEditAccess ? <AddCollaboratorInput /> : null}
          <CollaboratorList />
        </Stack>
      </ModalBody>
    </>
  )
}

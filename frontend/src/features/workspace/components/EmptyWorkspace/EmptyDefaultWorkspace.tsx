import { useTranslation } from 'react-i18next'

import { EmptyWorkspace, EmptyWorkspacePage } from './EmptyWorkspace'

export const EmptyDefaultWorkspace = ({
  isLoading,
  handleOpenCreateFormModal,
}: EmptyWorkspacePage) => {
  const { t } = useTranslation()
  const text = t('features.workspace.empty.default', { returnObjects: true })
  return (
    <EmptyWorkspace
      isLoading={isLoading}
      handleOpenCreateFormModal={handleOpenCreateFormModal}
      {...text}
    />
  )
}

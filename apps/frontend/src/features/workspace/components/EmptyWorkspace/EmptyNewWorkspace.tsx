import { useTranslation } from 'react-i18next'

import { EmptyWorkspace, EmptyWorkspacePage } from './EmptyWorkspace'

export const EmptyNewWorkspace = ({ isLoading }: EmptyWorkspacePage) => {
  const { t } = useTranslation()
  const text = t('features.workspace.empty.new', { returnObjects: true })
  return <EmptyWorkspace isLoading={isLoading} {...text} />
}

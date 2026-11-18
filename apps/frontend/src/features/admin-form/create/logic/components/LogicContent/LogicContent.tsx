import { useTranslation } from 'react-i18next'
import { Stack } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

import {
  isCreatingStateSelector,
  useAdminLogicStore,
} from '../../adminLogicStore'
import { useAdminFormLogic } from '../../hooks/useAdminFormLogic'

import { HeaderBlock } from './HeaderBlock'
import { LogicBlockFactory } from './LogicBlockFactory'
import { NewLogicBlock } from './NewLogicBlock'

export const LogicContent = (): JSX.Element | null => {
  const { t } = useTranslation()
  const isCreatingState = useAdminLogicStore(isCreatingStateSelector)
  const { formLogics, isLoading, hasError } = useAdminFormLogic()

  if (isLoading) return null

  return (
    <Stack color="secondary.500" spacing="1rem">
      {hasError ? (
        <InlineMessage variant="error">
          {t('features.adminForm.sidebar.logic.errors.formError')}
        </InlineMessage>
      ) : null}
      <HeaderBlock />
      {formLogics?.map((logic) => (
        <LogicBlockFactory key={logic._id} logic={logic} />
      ))}
      {isCreatingState ? <NewLogicBlock /> : null}
    </Stack>
  )
}

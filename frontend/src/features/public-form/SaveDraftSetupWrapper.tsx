import { useLayoutEffect } from 'react'

import { useIndexedDb } from '~hooks/useIndexedDb'

import { SAVE_DRAFT_INDEXEDDB_STORE_NAME } from '~features/form/constants'

import { DraftSubmission } from './PublicFormContext'

/**
 * Used in Storybook to set up draft data using hooks.
 */
const SaveDraftSetupWrapper = ({
  children,
  draftKey,
  draftValue,
}: {
  children: React.ReactNode
  draftKey: string
  draftValue: DraftSubmission
}) => {
  // Use the useIndexedDb hook to set draft value
  const [, setDraftSubmission] = useIndexedDb<DraftSubmission>({
    key: draftKey,
    initialValue: {
      lastUpdated: null,
      draftResponses: null,
      fieldDefinitionsChecksum: null,
    },
    storeName: SAVE_DRAFT_INDEXEDDB_STORE_NAME,
  })

  // Set the draft value when component mounts
  useLayoutEffect(() => {
    setDraftSubmission(draftValue)
  }, [setDraftSubmission, draftValue])

  return <>{children}</>
}

export default SaveDraftSetupWrapper

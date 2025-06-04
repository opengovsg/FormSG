import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/workspace/WorkspaceService'

export const convertEmailToStorageMode = async ({
  formId,
  publicKey,
}: {
  formId: string
  publicKey: string
}) => {
  return ApiService.post(
    `${ADMIN_FORM_ENDPOINT}/${formId}/convert-to-storage`,
    {
      publicKey,
    },
  ).then(({ data }) => data)
}

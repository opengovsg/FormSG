import { useMutation } from 'react-query'

import { FormResponseMode } from '~shared/types'

import {
  generateFormFields,
  generateQuestions,
} from '~features/admin-form/assistance/AssistanceService'
import { parseModelOutput } from '~features/admin-form/assistance/utils'
import {
  createEmailModeForm,
  createStorageModeOrMultirespondentForm,
} from '~features/workspace/WorkspaceService'

export const useAssistanceMutations = () => {
  const generateQuestionsMutation = useMutation((purpose: string) =>
    generateQuestions(purpose),
  )

  const generateEmailFormFieldsMutation = useMutation(
    async ({
      type,
      content,
      formName,
      email,
    }: {
      type: string
      content: string
      formName: string
      email: string
    }) =>
      generateFormFields(type, content).then(async (data) => {
        let formFields
        if (data.content) {
          formFields = JSON.parse(parseModelOutput(data.content))
        }
        // todo: remove from mutation
        return await createEmailModeForm({
          title: formName,
          emails: [email],
          responseMode: FormResponseMode.Email,
          form_fields: formFields,
        })
      }),
  )

  const generateEncryptFormFieldsMutation = useMutation(
    async ({
      type,
      content,
      formName,
      publicKey,
    }: {
      type: string
      content: string
      formName: string
      publicKey: string
    }) =>
      generateFormFields(type, content).then(async (data) => {
        let formFields
        if (data.content) {
          formFields = JSON.parse(parseModelOutput(data.content))
        }
        // todo: remove from mutation
        return await createStorageModeOrMultirespondentForm({
          title: formName,
          publicKey,
          responseMode: FormResponseMode.Encrypt,
          form_fields: formFields,
        })
      }),
  )

  return {
    generateEmailFormFieldsMutation,
    generateEncryptFormFieldsMutation,
    generateQuestionsMutation,
  }
}

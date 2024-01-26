import { useMutation } from 'react-query'

import { FormResponseMode } from '~shared/types'

import {
  generateFormFields,
  generateQuestions,
} from '~features/admin-form/assistance/AssistanceService'
import { parseModelOutput } from '~features/admin-form/assistance/utils'
import { createEmailModeForm } from '~features/workspace/WorkspaceService'

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
      await generateFormFields(type, content).then(async (data) => {
        let formFields
        if (data.content) {
          formFields = JSON.parse(parseModelOutput(data.content))
        }
        // todo: add create fields
        return await createEmailModeForm({
          title: formName,
          emails: [email],
          responseMode: FormResponseMode.Email,
        })
      }),
  )
}

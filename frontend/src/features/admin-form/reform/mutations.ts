import { useMutation } from 'react-query'

import { FormResponseMode } from '~shared/types'

import { createEmailModeForm } from '~features/workspace/WorkspaceService'

import { getFormFields, getQuestionsList } from './ReformService'
import { parseModelOutput } from './utils'

export const useReformMutations = () => {
  const getQuestionsListMutation = useMutation((purpose: string) =>
    getQuestionsList(purpose),
  )

  const getFormFieldsMutation = useMutation(
    async ({
      purpose,
      questions,
      prevMessages,
      formName,
      email,
    }: {
      purpose: string
      questions: string
      prevMessages: { role: string; content: string }[]
      formName: string
      email: string
    }) =>
      await getFormFields(prevMessages, purpose, questions).then(
        async (data) => {
          console.log(data)
          const formFields = JSON.parse(parseModelOutput(data.content))
          return await createEmailModeForm({
            title: formName,
            emails: [email],
            responseMode: FormResponseMode.Email,
            form_fields: formFields,
          })
        },
      ),
  )

  return {
    getQuestionsListMutation,
    getFormFieldsMutation,
  }
}

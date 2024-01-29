import { useMutation } from 'react-query'

import { ContentTypes } from '~shared/types/assistance'

import {
  generateFormFields,
  generateQuestions,
} from '~features/admin-form/assistance/AssistanceService'
import { parseModelOutput } from '~features/admin-form/assistance/utils'
import { useCreateFormField } from '~features/admin-form/create/builder-and-design/mutations/useCreateFormField'

export const useAssistanceMutations = () => {
  const { createFieldsMutation } = useCreateFormField()

  const createFieldsFromPromptMutation = useMutation((prompt: string) =>
    generateFormFields(ContentTypes.QUESTIONS, prompt).then((data) => {
      let formFields
      if (data.content) {
        formFields = JSON.parse(parseModelOutput(data.content))
      }
      return createFieldsMutation.mutate(formFields)
    }),
  )

  const generateQuestionsMutation = useMutation((purpose: string) =>
    generateQuestions(purpose),
  )

  const generateEmailFormFieldsMutation = useMutation(
    async ({ type, content }: { type: string; content: string }) =>
      generateFormFields(type, content),
  )

  const generateEncryptFormFieldsMutation = useMutation(
    async ({ type, content }: { type: string; content: string }) =>
      generateFormFields(type, content),
  )

  // todo: remove example to use createFormFieldsMutation
  const generateEncryptFormFieldsMutationExample = useMutation(
    async ({ type, content }: { type: string; content: string }) => {
      generateFormFields(type, content).then(async (data) => {
        let formFields
        if (data.content) {
          formFields = JSON.parse(parseModelOutput(data.content))
        }
        // todo: remove from mutation
        return createFieldsMutation.mutate(formFields)
      })
    },
  )

  return {
    createFieldsFromPromptMutation,
    generateEmailFormFieldsMutation,
    generateEncryptFormFieldsMutation,
    generateQuestionsMutation,
    generateEncryptFormFieldsMutationExample,
  }
}

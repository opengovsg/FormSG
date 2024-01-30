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
    generateQuestions(prompt)
      .then((questions) =>
        generateFormFields(ContentTypes.QUESTIONS, String(questions)),
      )
      .then((data) => {
        let formFields
        if (data.content) {
          formFields = JSON.parse(parseModelOutput(data.content))
        }
        return createFieldsMutation.mutate(formFields)
      }),
  )

  const createFieldsFromPdfMutation = useMutation((pdfContent: string) =>
    generateFormFields(ContentTypes.PDF, pdfContent).then((data) => {
      let formFields
      if (data.content) {
        formFields = JSON.parse(parseModelOutput(data.content))
      }
      return createFieldsMutation.mutate(formFields)
    }),
  )

  return {
    createFieldsFromPromptMutation,
    createFieldsFromPdfMutation,
  }
}

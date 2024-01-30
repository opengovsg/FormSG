import { useContext } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { ContentTypes } from '~shared/types/assistance'

import {
  generateFormFields,
  generateQuestions,
} from '~features/admin-form/assistance/AssistanceService'
import { parseModelOutput } from '~features/admin-form/assistance/utils'
import { useCreateFormField } from '~features/admin-form/create/builder-and-design/mutations/useCreateFormField'

import { adminFormKeys } from '../common/queries'
import { MagicFormBuilderModalOnCloseContext } from '../create/builder-and-design/BuilderAndDesignContent/FormBuilder'

export const useAssistanceMutations = () => {
  const { createFieldsMutation } = useCreateFormField()
  const { formId } = useParams()

  if (!formId) {
    throw new Error('Form ID is required')
  }

  const queryClient = useQueryClient()

  const onCloseContext = useContext(MagicFormBuilderModalOnCloseContext)
  const { onClose } = onCloseContext || {}

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
        return createFieldsMutation.mutate(formFields, {
          onSuccess: () => {
            queryClient.invalidateQueries(adminFormKeys.id(formId))
            onClose()
          },
        })
      }),
  )

  const createFieldsFromPdfMutation = useMutation((pdfContent: string) =>
    generateFormFields(ContentTypes.PDF, pdfContent).then((data) => {
      let formFields
      if (data.content) {
        formFields = JSON.parse(parseModelOutput(data.content))
      }
      return createFieldsMutation.mutate(formFields, {
        onSuccess: () => {
          queryClient.invalidateQueries(adminFormKeys.id(formId))
          onClose()
        },
      })
    }),
  )

  return {
    createFieldsFromPromptMutation,
    createFieldsFromPdfMutation,
  }
}

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

import { useToast } from '../../../hooks/useToast'
import { adminFormKeys } from '../common/queries'
import { MagicFormBuilderModalOnCloseContext } from '../create/builder-and-design/BuilderAndDesignContent/FormBuilder'

export const useAssistanceMutations = () => {
  const { createFieldsMutation } = useCreateFormField()
  const { formId } = useParams()

  if (!formId) {
    throw new Error('Form ID is required')
  }

  const toast = useToast({ status: 'success', isClosable: true })

  const queryClient = useQueryClient()

  const onCloseContext = useContext(MagicFormBuilderModalOnCloseContext)
  const { onClose } = onCloseContext || {}

  const createFieldsFromPromptMutation = useMutation((prompt: string) =>
    generateQuestions(prompt)
      .then((questions) => {
        if (!questions.content) {
          throw new Error('No content in questions')
        }

        return generateFormFields(ContentTypes.QUESTIONS, questions.content)
      })
      .then((data) => {
        let formFields
        if (data.content) {
          try {
            formFields = JSON.parse(parseModelOutput(data.content))
          } catch (e) {
            toast({
              description: `Error creating form. Reason: ${e}`,
              status: 'warning',
            })
            return
          }
        }
        return createFieldsMutation.mutate(formFields, {
          onSuccess: () => {
            queryClient.invalidateQueries(adminFormKeys.id(formId))
            onClose()
            toast({
              description: 'Successfully created form',
            })
          },
          onError: () => {
            toast({
              description: 'Error creating form.',
              status: 'warning',
            })
          },
        })
      }),
  )

  const createFieldsFromPdfMutation = useMutation((pdfContent: string) =>
    generateFormFields(ContentTypes.PDF, pdfContent).then((data) => {
      let formFields
      if (data.content) {
        try {
          formFields = JSON.parse(parseModelOutput(data.content))
        } catch (e) {
          toast({
            description: `Error creating form. Reason: ${e}`,
            status: 'warning',
          })
          return
        }
      }
      return createFieldsMutation.mutate(formFields, {
        onSuccess: () => {
          queryClient.invalidateQueries(adminFormKeys.id(formId))
          onClose()
          toast({
            description: 'Successfully created form',
          })
        },
        onError: () => {
          toast({
            description: 'Error creating form.',
            status: 'warning',
          })
        },
      })
    }),
  )

  return {
    createFieldsFromPromptMutation,
    createFieldsFromPdfMutation,
  }
}

import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import { StatusCodes } from 'http-status-codes'

import { ContentTypes } from '~shared/types/assistance'

import { HttpError } from '~services/ApiService'

import {
  generateFormFields,
  generateQuestions,
} from '~features/admin-form/assistance/AssistanceService'
import { parseModelOutput } from '~features/admin-form/assistance/utils'
import { useCreateFormField } from '~features/admin-form/create/builder-and-design/mutations/useCreateFormField'

import { useToast } from '../../../hooks/useToast'
import { adminFormKeys } from '../common/queries'

export const useAssistanceMutations = () => {
  const { createFieldsMutation } = useCreateFormField()
  const { formId } = useParams()

  if (!formId) {
    throw new Error('Form ID is required')
  }

  const queryClient = useQueryClient()

  const toast = useToast({ status: 'success', isClosable: true })

  const createFieldsFromPromptMutation = useMutation(
    (prompt: string) =>
      generateQuestions(ContentTypes.PROMPT, prompt)
        .then((questions) => {
          if (!questions.content) {
            throw new Error('No content in questions')
          }
          return generateFormFields(questions.content)
        })
        .then((data) => {
          let formFields
          if (data.content) {
            try {
              formFields = JSON.parse(parseModelOutput(data.content))
            } catch (e) {
              console.error(e)
              throw e
            }
          }
          return createFieldsMutation.mutate(formFields, {
            onSuccess: () => {
              queryClient.invalidateQueries(adminFormKeys.id(formId))
            },
            onError: (error) => {
              console.error(error)
            },
          })
        }),
    {
      onError: (error: Error) => {
        if (error instanceof HttpError) {
          let errorMessage
          switch (error.code) {
            case StatusCodes.TOO_MANY_REQUESTS:
              errorMessage =
                'Too many forms created! Please try creating again later.'
              break
            default:
              errorMessage =
                'Sorry, we are unable to generate a form with your prompt. Please try another prompt or manually create form fields.'
          }
          toast({
            description: `${errorMessage}`,
            status: 'danger',
          })
        } else {
          toast({
            description:
              'Sorry, we are unable to generate a form with your prompt. Please try another prompt or manually create form fields.',
            status: 'danger',
          })
        }
      },
    },
  )

  const createFieldsFromPdfMutation = useMutation(
    (pdfContent: string) =>
      generateQuestions(ContentTypes.PDF, pdfContent)
        .then((questions) => {
          if (!questions.content) {
            throw new Error('No content in questions')
          }
          return generateFormFields(questions.content)
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
              throw new Error('Unable to create form fields')
            }
          }
          return createFieldsMutation.mutate(formFields)
        }),
    {
      onError: (error: Error) => {
        if (error instanceof HttpError) {
          let errorMessage
          switch (error.code) {
            case StatusCodes.TOO_MANY_REQUESTS:
              errorMessage =
                'Too many forms created! Please try creating again later.'

              break

            default:
              errorMessage = 'An error occurred. Please try again.'
          }
          toast({
            description: `${errorMessage}`,
            status: 'danger',
          })
        }
      },
    },
  )

  return {
    createFieldsFromPromptMutation,
    createFieldsFromPdfMutation,
  }
}

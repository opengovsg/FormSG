import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate, useParams } from 'react-router-dom'

import {
  AdminFormDto,
  AdminStorageFormDto,
  EndPageUpdateDto,
  FormPermission,
  FormPermissionsDto,
  PaymentsProductUpdateDto,
  PaymentsUpdateDto,
  StartPageUpdateDto,
} from 'formsg-shared/types/form/form'

import { DASHBOARD_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'
import { HttpError } from '~services/ApiService'

import {
  SubmitEmailFormArgs,
  SubmitStorageFormArgs,
} from '~features/public-form/PublicFormService'
import { workspaceKeys } from '~features/workspace/queries'

import {
  submitEmailModeFormPreview,
  submitEmailModeFormPreviewWithFetch,
  submitStorageModeFormPreview,
  submitStorageModeFormPreviewWithFetch,
} from '../common/AdminViewFormService'
import { downloadFormIssue } from '../responses/FeedbackPage/issue/IssueService'
import { downloadFormReview } from '../responses/FeedbackPage/review/ReviewService'
import { sendReminderForPendingMrfResponse } from '../responses/ResponsesPage/storage/UnlockedResponses/ResponsesTable/reminders/ReminderService'

import { useCollaboratorWizard } from './components/CollaboratorModal/CollaboratorWizardContext'
import { permissionsToRole } from './components/CollaboratorModal/utils'
import {
  updateFormEndPage,
  updateFormPaymentProducts,
  updateFormPayments,
  updateFormStartPage,
} from './AdminFormPageService'
import {
  removeSelfFromFormCollaborators,
  transferFormOwner,
  updateFormCollaborators,
} from './AdminViewFormService'
import { adminFormKeys } from './queries'

export type MutateAddCollaboratorArgs = {
  newPermission: FormPermission
  currentPermissions: FormPermissionsDto
}

export type MutateRemoveCollaboratorArgs = {
  permissionToRemove: FormPermission
  currentPermissions: FormPermissionsDto
}

export type DownloadFormFeedbackMutationArgs = {
  formId: string
  formTitle: string
}

export type DownloadFormIssuesMutationArgs = {
  formId: string
  formTitle: string
  count: number | undefined
}

enum FormCollaboratorAction {
  UPDATE,
  ADD,
  REMOVE,
  TRANSFER_OWNERSHIP,
  REMOVE_SELF,
}

export const useMutateCollaborators = () => {
  const { formId } = useCollaboratorWizard()
  if (!formId) throw new Error('No formId provided to useMutateCollaborators')

  const { t } = useTranslation()

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })

  const updateFormData = useCallback(
    (newData: FormPermissionsDto) => {
      queryClient.setQueryData(adminFormKeys.collaborators(formId), newData)
      // Only update adminForm if it already has prior data.
      queryClient.setQueryData<AdminFormDto | undefined>(
        adminFormKeys.id(formId),
        (oldData) =>
          oldData
            ? {
                ...oldData,
                permissionList: newData,
              }
            : undefined,
      )
    },
    [formId, queryClient],
  )

  const getMappedBadRequestErrorMessage = useCallback(
    (
      formCollaboratorAction: FormCollaboratorAction,
      originalErrorMessage: string,
    ): string => {
      switch (formCollaboratorAction) {
        case FormCollaboratorAction.ADD:
          return t(
            'features.common.adminFormMutations.collaborators.errors.badRequestAddOrEdit',
          )
        case FormCollaboratorAction.TRANSFER_OWNERSHIP:
          return originalErrorMessage
        default:
          return t(
            'features.common.adminFormMutations.collaborators.errors.badRequestGeneric',
          )
      }
    },
    [t],
  )

  const getMappedDefaultErrorMessage = useCallback(
    (formCollaboratorAction: FormCollaboratorAction): string => {
      switch (formCollaboratorAction) {
        case FormCollaboratorAction.ADD:
          return t(
            'features.common.adminFormMutations.collaborators.errors.add',
          )
        case FormCollaboratorAction.UPDATE:
          return t(
            'features.common.adminFormMutations.collaborators.errors.update',
          )
        case FormCollaboratorAction.REMOVE:
          return t(
            'features.common.adminFormMutations.collaborators.errors.remove',
          )
        case FormCollaboratorAction.REMOVE_SELF:
          return t(
            'features.common.adminFormMutations.collaborators.errors.removeSelf',
          )
        case FormCollaboratorAction.TRANSFER_OWNERSHIP:
          return t(
            'features.common.adminFormMutations.collaborators.errors.transferOwnership',
          )
        //should not reach
        default:
          return t(
            'features.common.adminFormMutations.collaborators.errors.generic',
          )
      }
    },
    [t],
  )

  const getMappedErrorMessage = useCallback(
    (
      error: Error,
      formCollaboratorAction: FormCollaboratorAction,
      requestEmail?: string,
    ): string => {
      // check if error is an instance of HttpError to be able to access status code of error
      if (error instanceof HttpError) {
        let errorMessage
        switch (error.code) {
          case 422:
            errorMessage = requestEmail
              ? t(
                  'features.common.adminFormMutations.collaborators.errors.notWhitelistedAgency',
                  {
                    email: requestEmail,
                  },
                )
              : t(
                  'features.common.adminFormMutations.collaborators.errors.unexpected422',
                )
            break
          case 400:
            errorMessage = getMappedBadRequestErrorMessage(
              formCollaboratorAction,
              error.message,
            )
            break
          default:
            errorMessage = getMappedDefaultErrorMessage(formCollaboratorAction)
        }
        return errorMessage
      }
      // if error is not of type HttpError return the error message encapsulated in Error object
      return error.message
    },
    [getMappedBadRequestErrorMessage, getMappedDefaultErrorMessage, t],
  )

  const handleSuccess = useCallback(
    ({
      newData,
      toastDescription,
    }: {
      newData: FormPermissionsDto
      toastDescription: React.ReactNode
    }) => {
      toast.closeAll()
      updateFormData(newData)

      // Show toast on success.
      toast({
        description: toastDescription,
      })
    },
    [toast, updateFormData],
  )

  const handleError = useCallback(
    (
      error: Error,
      formCollaboratorAction: FormCollaboratorAction,
      requestEmail?: string,
    ) => {
      toast.closeAll()
      toast({
        description: getMappedErrorMessage(
          error,
          formCollaboratorAction,
          requestEmail,
        ),
        status: 'danger',
      })
    },
    [getMappedErrorMessage, toast],
  )

  const mutateUpdateCollaborator = useMutation(
    ({
      permissionToUpdate,
      currentPermissions,
    }: {
      permissionToUpdate: FormPermission
      currentPermissions: FormPermissionsDto
    }) => {
      const index = currentPermissions.findIndex(
        (c) => c.email === permissionToUpdate.email,
      )
      if (index === -1)
        throw new Error(
          t(
            'features.common.adminFormMutations.collaborators.collaboratorNotFound',
          ),
        )
      const permissionListToUpdate = currentPermissions.slice()
      // Replace old permissions with new permission.
      permissionListToUpdate[index] = permissionToUpdate

      return updateFormCollaborators(formId, permissionListToUpdate)
    },
    {
      onSuccess: (newData, { permissionToUpdate }) => {
        const toastDescription = t(
          'features.common.adminFormMutations.collaborators.success.updatedToRole',
          {
            email: permissionToUpdate.email,
            role: permissionsToRole(permissionToUpdate),
          },
        )
        handleSuccess({ newData, toastDescription })
      },
      onError: (error: Error, { permissionToUpdate }) => {
        handleError(
          error,
          FormCollaboratorAction.UPDATE,
          permissionToUpdate.email,
        )
      },
    },
  )

  const mutateAddCollaborator = useMutation(
    ({ newPermission, currentPermissions }: MutateAddCollaboratorArgs) => {
      const rebuiltPermissions = [newPermission].concat(currentPermissions)
      return updateFormCollaborators(formId, rebuiltPermissions)
    },
    {
      onSuccess: (newData, { newPermission }) => {
        const toastDescription = t(
          'features.common.adminFormMutations.collaborators.success.addedAs',
          {
            email: newPermission.email,
            role: permissionsToRole(newPermission),
          },
        )
        handleSuccess({ newData, toastDescription })
      },
      onError: (error: Error, { newPermission }) => {
        handleError(error, FormCollaboratorAction.ADD, newPermission.email)
      },
    },
  )

  const mutateRemoveCollaborator = useMutation(
    ({
      permissionToRemove,
      currentPermissions,
    }: MutateRemoveCollaboratorArgs) => {
      const filteredList = currentPermissions.filter(
        (c) => c.email !== permissionToRemove.email,
      )
      return updateFormCollaborators(formId, filteredList)
    },
    {
      onSuccess: (newData, { permissionToRemove }) => {
        // TODO: Decide if we want to allow redo (via readding permission)

        const toastDescription = t(
          'features.common.adminFormMutations.collaborators.success.removed',
          {
            email: permissionToRemove.email,
          },
        )
        handleSuccess({ newData, toastDescription })
      },
      onError: (error: Error) => {
        handleError(error, FormCollaboratorAction.REMOVE)
      },
    },
  )

  const mutateTransferFormOwnership = useMutation(
    (newOwnerEmail: string) => transferFormOwner(formId, newOwnerEmail),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        // Show toast on success.
        toast({
          description: t(
            'features.common.adminFormMutations.collaborators.success.newOwner',
            {
              email: newData.form.admin.email,
            },
          ),
        })

        // Update cached data.
        queryClient.setQueryData(
          adminFormKeys.collaborators(formId),
          newData.form.permissionList,
        )
        queryClient.setQueryData<AdminFormDto | undefined>(
          adminFormKeys.id(formId),
          newData.form,
        )
      },
      onError: (error: Error) => {
        handleError(error, FormCollaboratorAction.TRANSFER_OWNERSHIP)
      },
    },
  )

  const mutateRemoveSelf = useMutation(
    () => removeSelfFromFormCollaborators(formId),
    {
      onSuccess: () => {
        toast({
          description: t(
            'features.common.adminFormMutations.collaborators.success.removeSelf',
          ),
        })

        // Remove all related queries from cache.
        queryClient.removeQueries(adminFormKeys.id(formId))
        queryClient.invalidateQueries(workspaceKeys.dashboard)
        queryClient.invalidateQueries(workspaceKeys.workspaces)

        navigate(DASHBOARD_ROUTE)
      },
      onError: (error: Error) => {
        handleError(error, FormCollaboratorAction.REMOVE_SELF)
      },
    },
  )

  return {
    mutateAddCollaborator,
    mutateUpdateCollaborator,
    mutateRemoveCollaborator,
    mutateTransferFormOwnership,
    mutateRemoveSelf,
  }
}

export const useMutateFormPage = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')
  const { t } = useTranslation()

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })

  const handleError = useCallback(
    (error: Error) => {
      toast.closeAll()
      toast({
        description: error.message,
        status: 'danger',
      })
    },
    [toast],
  )

  const startPageMutation = useMutation(
    (startPage: StartPageUpdateDto) => updateFormStartPage(formId, startPage),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto | undefined>(
          adminFormKeys.id(formId),
          (oldData) =>
            oldData ? { ...oldData, startPage: newData } : undefined,
        )
        toast({
          description: t(
            'features.common.adminFormMutations.formPage.headerAndInstructionsUpdated',
          ),
        })
      },
      onError: handleError,
    },
  )

  const endPageMutation = useMutation(
    (endPage: EndPageUpdateDto) => updateFormEndPage(formId, endPage),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        queryClient.setQueryData<AdminFormDto | undefined>(
          adminFormKeys.id(formId),
          (oldData) => (oldData ? { ...oldData, endPage: newData } : undefined),
        )
        toast({
          description: t(
            'features.common.adminFormMutations.formPage.thankYouPageUpdated',
          ),
        })
      },
      onError: handleError,
    },
  )

  const paymentsMutation = useMutation(
    (payments_field: PaymentsUpdateDto) =>
      updateFormPayments(formId, payments_field),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        queryClient.setQueryData<AdminStorageFormDto | undefined>(
          adminFormKeys.id(formId),
          (oldData) =>
            oldData ? { ...oldData, payments_field: newData } : undefined,
        )
        toast({
          description: t(
            'features.common.adminFormMutations.formPage.paymentUpdated',
          ),
        })
      },
      onError: handleError,
    },
  )

  const paymentsProductMutation = useMutation(
    (products: PaymentsProductUpdateDto) =>
      updateFormPaymentProducts(formId, products),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        queryClient.setQueryData<AdminStorageFormDto | undefined>(
          adminFormKeys.products(formId, newData),
          (oldData) =>
            oldData
              ? {
                  ...oldData,
                  payments_field: {
                    ...oldData.payments_field,
                    products: newData,
                  },
                }
              : undefined,
        )
        toast({
          description: t(
            'features.common.adminFormMutations.formPage.paymentsProductUpdated',
          ),
        })
      },
      onError: handleError,
    },
  )

  return {
    startPageMutation,
    endPageMutation,
    paymentsMutation,
    paymentsProductMutation,
  }
}

export const usePreviewFormMutations = (formId: string) => {
  const submitEmailModeFormMutation = useMutation(
    (args: Omit<SubmitEmailFormArgs, 'formId'>) => {
      return submitEmailModeFormPreview({ ...args, formId })
    },
  )

  const submitStorageModeFormMutation = useMutation(
    (args: Omit<SubmitStorageFormArgs, 'formId'>) => {
      return submitStorageModeFormPreview({ formId })
    },
  )

  // TODO (#5826): Fallback mutation using Fetch. Remove once network error is resolved
  const submitEmailModeFormFetchMutation = useMutation(
    (args: Omit<SubmitEmailFormArgs, 'formId'>) => {
      return submitEmailModeFormPreviewWithFetch({ ...args, formId })
    },
  )

  const submitStorageModeFormFetchMutation = useMutation(
    (args: Omit<SubmitStorageFormArgs, 'formId'>) => {
      return submitStorageModeFormPreviewWithFetch({ formId })
    },
  )

  return {
    submitEmailModeFormMutation,
    submitStorageModeFormMutation,
    submitEmailModeFormFetchMutation,
    submitStorageModeFormFetchMutation,
  }
}

export const useFormFeedbackMutations = (headers: string[]) => {
  const { t } = useTranslation()

  const toast = useToast({ status: 'success', isClosable: true })

  const handleError = useCallback(
    (error: Error) => {
      toast.closeAll()
      toast({
        description: error.message,
        status: 'danger',
      })
    },
    [toast],
  )

  const downloadFormFeedbackMutation = useMutation(
    ({ formId, formTitle }: DownloadFormFeedbackMutationArgs) =>
      downloadFormReview(formId, formTitle, headers),
    {
      onSuccess: () => {
        toast({
          description: t(
            'features.common.adminFormMutations.downloads.feedbackStarted',
          ),
        })
      },
      onError: handleError,
    },
  )

  return { downloadFormFeedbackMutation }
}

export const useFormIssueMutations = (headers: string[]) => {
  const { t } = useTranslation()

  const toast = useToast({ status: 'success', isClosable: true })

  const handleError = useCallback(
    (error: Error) => {
      toast.closeAll()
      toast({
        description: error.message,
        status: 'danger',
      })
    },
    [toast],
  )

  const downloadFormIssuesMutation = useMutation(
    ({ formId, formTitle, count }: DownloadFormIssuesMutationArgs) =>
      downloadFormIssue(formId, formTitle, count || 0, headers),
    {
      onSuccess: () => {
        toast({
          description: t(
            'features.common.adminFormMutations.downloads.issuesStarted',
          ),
        })
      },
      onError: handleError,
    },
  )

  return { downloadFormIssueMutation: downloadFormIssuesMutation }
}

export const useFormRemindersMutations = () => {
  const { t } = useTranslation()

  const toast = useToast({ status: 'success', isClosable: true })
  const handleError = useCallback(
    (error: Error) => {
      toast.closeAll()
      toast({
        description: error.message,
        status: 'danger',
      })
    },
    [toast],
  )

  const sendReminderForResponseMutation = useMutation(
    ({
      formId,
      submissionId,
      submissionSecretKey,
    }: {
      formId: string
      submissionId: string
      submissionSecretKey: string
    }) => {
      return sendReminderForPendingMrfResponse({
        formId,
        submissionId,
        submissionSecretKey,
      })
    },
    {
      onSuccess: () => {
        toast({
          description: t('features.common.adminFormMutations.reminders.sent'),
        })
      },
      onError: handleError,
    },
  )

  return { sendReminderForResponseMutation }
}

import {
  AdminFeedbackDto,
  AdminFeedbackRating,
  AdminUseEmailModeFeedbackDto,
  BasicField,
  ErrorDto,
} from '~shared/types'
import {
  AdminDashboardFormMetaDto,
  CreateEmailFormBodyDto,
  CreateMultirespondentFormBodyDto,
  CreateStorageFormBodyDto,
  DuplicateFormBodyDto,
  FormDto,
  FormId,
  PublicFormViewDto,
} from '~shared/types/form/form'
import { WorkspaceDto } from '~shared/types/workspace'
import { removeAt } from '~shared/utils/immutable-array-fns'

import { ApiService } from '~services/ApiService'
import { CHECKBOX_OTHERS_INPUT_VALUE } from '~templates/Field/Checkbox/constants'

import { PUBLIC_FORMS_ENDPOINT } from '~features/public-form/PublicFormService'

export const ADMIN_FORM_ENDPOINT = '/admin/forms'
const ADMIN_WORKSPACES_ENDPOINT = '/admin/workspaces'

/**
 * Gets metadata for all forms in dashboard view i.e. forms which user
 * owns or collaborates on
 * @returns Metadata required for forms on dashboard view
 */
export const getDashboardView = async (): Promise<
  AdminDashboardFormMetaDto[]
> => {
  return ApiService.get<AdminDashboardFormMetaDto[]>(
    `${ADMIN_FORM_ENDPOINT}`,
  ).then(({ data }) => data)
}

export const getWorkspacesView = async (): Promise<WorkspaceDto[]> => {
  return ApiService.get<WorkspaceDto[]>(`${ADMIN_WORKSPACES_ENDPOINT}`).then(
    ({ data }) => data,
  )
}

export const createWorkspace = async ({
  title,
}: {
  title: string
}): Promise<WorkspaceDto> => {
  return ApiService.post<WorkspaceDto>(`${ADMIN_WORKSPACES_ENDPOINT}`, {
    title,
  }).then(({ data }) => data)
}

export const moveFormsToWorkspace = async ({
  formIds,
  destWorkspaceId,
}: {
  formIds: string[]
  destWorkspaceId: string
}): Promise<string[]> => {
  return ApiService.post<string[]>(`${ADMIN_WORKSPACES_ENDPOINT}/move`, {
    formIds,
    destWorkspaceId,
  }).then(({ data }) => data)
}

export const updateWorkspaceTitle = async ({
  title,
  destWorkspaceId,
}: {
  title: string
  destWorkspaceId: string
}): Promise<WorkspaceDto> => {
  return ApiService.put<WorkspaceDto>(
    `${ADMIN_WORKSPACES_ENDPOINT}/${destWorkspaceId}/title`,
    {
      title,
    },
  ).then(({ data }) => data)
}

export const deleteWorkspace = async ({
  destWorkspaceId,
}: {
  destWorkspaceId: string
}): Promise<void> => {
  return ApiService.delete(`${ADMIN_WORKSPACES_ENDPOINT}/${destWorkspaceId}`)
}

export const removeFormsFromWorkspaces = async ({
  formIds,
}: {
  formIds: string[]
}): Promise<void> => {
  return ApiService.post(`${ADMIN_WORKSPACES_ENDPOINT}/remove`, { formIds })
}

export const createEmailModeForm = async (
  body: CreateEmailFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(ADMIN_FORM_ENDPOINT, { form: body }).then(
    ({ data }) => data,
  )
}

export const createStorageModeForm = async (
  body: CreateStorageFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(ADMIN_FORM_ENDPOINT, { form: body }).then(
    ({ data }) => data,
  )
}

export const createMultirespondentModeForm = async (
  body: CreateMultirespondentFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(ADMIN_FORM_ENDPOINT, { form: body }).then(
    ({ data }) => data,
  )
}

// TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
const createFeedbackResponses = (
  formInputs: AdminUseEmailModeFeedbackDto,
  feedbackForm: PublicFormViewDto,
) => {
  // const feedbackFormFieldsStructure: [string, number][] = [['reason', 0]]

  const { fieldType, title, _id } = feedbackForm.form.form_fields[0]

  const reasonCheckboxAnswerArray = formInputs['reason']
  let answerArray: string[] = []
  if (
    reasonCheckboxAnswerArray !== undefined &&
    reasonCheckboxAnswerArray.value
  ) {
    const othersIndex = reasonCheckboxAnswerArray.value.findIndex(
      (v) => v === CHECKBOX_OTHERS_INPUT_VALUE,
    )
    // Others is checked, so we need to add the input at othersInput to the answer array
    if (othersIndex !== -1) {
      answerArray = removeAt(reasonCheckboxAnswerArray.value, othersIndex)
      answerArray.push(`Others: ${reasonCheckboxAnswerArray.othersInput}`)
    } else {
      answerArray = reasonCheckboxAnswerArray.value
    }
  }

  const responses = [
    {
      _id,
      question: title,
      answerArray,
      fieldType,
    },
    ...(formInputs.adminEmail && feedbackForm.form.form_fields.length > 1
      ? [
          {
            _id: feedbackForm.form.form_fields[1]._id,
            question: feedbackForm.form.form_fields[1].title,
            answer: formInputs.adminEmail,
            fieldType: feedbackForm.form.form_fields[1].fieldType,
          },
        ]
      : []),
  ]

  return responses
}

const createAdminEmailModeUseFeedback = (
  formInputs: AdminUseEmailModeFeedbackDto,
  feedbackForm: PublicFormViewDto,
) => {
  const responses = createFeedbackResponses(formInputs, feedbackForm)
  // convert content to FormData object
  const formData = new FormData()
  formData.append('body', JSON.stringify({ responses, version: 2.1 }))

  return formData
}

// TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
export const submitUseEmailFormFeedback = async ({
  body,
  feedbackForm,
}: {
  body: AdminUseEmailModeFeedbackDto
  feedbackForm: PublicFormViewDto
}): Promise<boolean | ErrorDto> => {
  if (!feedbackForm) return new Error('feedback form not provided')
  const formData = createAdminEmailModeUseFeedback(body, feedbackForm)
  return ApiService.post<boolean>(
    `${PUBLIC_FORMS_ENDPOINT}/submissions/storage/email-mode-feedback?captchaResponse=null`,
    formData,
  ).then(({ data }) => data)
}

export const dupeEmailModeForm = async (
  formId: string,
  body: DuplicateFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/duplicate`,
    body,
  ).then(({ data }) => data)
}

export const dupeStorageModeForm = async (
  formId: FormId,
  body: DuplicateFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/duplicate`,
    body,
  ).then(({ data }) => data)
}

export const dupeMultirespondentModeForm = async (
  formId: string,
  body: DuplicateFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/duplicate`,
    body,
  ).then(({ data }) => data)
}

export const deleteAdminForm = async (formId: string): Promise<void> => {
  return ApiService.delete(`${ADMIN_FORM_ENDPOINT}/${formId}`)
}

export const createAdminFeedback = async (
  rating: AdminFeedbackRating,
): Promise<AdminFeedbackDto> => {
  return ApiService.post(`${ADMIN_FORM_ENDPOINT}/feedback`, { rating }).then(
    ({ data }) => data.feedback,
  )
}

export const updateAdminFeedback = async (
  feedbackId: string,
  comment: string,
): Promise<boolean> => {
  return ApiService.patch(`${ADMIN_FORM_ENDPOINT}/feedback/${feedbackId}`, {
    comment,
  }).then(({ data }) => data)
}

import {
  CreateEmailFormBodyDto,
  CreateStorageFormBodyDto,
  FormDto,
} from '~shared/types'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../common/AdminViewFormService'

export const createEmailModeTemplateForm = async (
  formId: string,
  body: CreateEmailFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/use-template`,
    body,
  ).then(({ data }) => data)
}

export const createStorageModeTemplateForm = async (
  formId: string,
  body: CreateStorageFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/use-template`,
    body,
  ).then(({ data }) => data)
}

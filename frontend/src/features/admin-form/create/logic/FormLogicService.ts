import { FormLogic, LogicDto } from '~shared/types/form'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

export const createFormLogic = async (
  formId: string,
  createLogicBody: FormLogic,
): Promise<LogicDto> => {
  return ApiService.post<LogicDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/logic`,
    createLogicBody,
  ).then(({ data }) => data)
}

export const deleteFormLogic = async (
  formId: string,
  logicId: string,
): Promise<true> => {
  return ApiService.delete(
    `${ADMIN_FORM_ENDPOINT}/${formId}/logic/${logicId}`,
  ).then(() => true)
}

export const updateFormLogic = async (
  formId: string,
  logicId: string,
  updatedLogic: LogicDto,
): Promise<LogicDto> => {
  return ApiService.put<LogicDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/logic/${logicId}`,
    updatedLogic,
  ).then(({ data }) => data)
}

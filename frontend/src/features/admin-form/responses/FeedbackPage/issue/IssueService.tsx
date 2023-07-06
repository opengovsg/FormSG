import { FormIssueDto, FormIssueMetaDto } from '~shared/types'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'
import { IssueCsvGenerator } from '~features/admin-form/responses/FeedbackPage/utils/IssueCsvGenerator'

export const getFormIssues = async (
  formId: string,
): Promise<FormIssueMetaDto> => {
  return ApiService.get<FormIssueMetaDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/issue`,
  ).then(({ data }) => data)
}

/**
 * Download issues for a given form.
 * @param formId the id of the form to download issues for
 * @param formTitle the title of the form
 * @param count estimated issue counts
 * @returns a stream of feedback
 */
export const downloadFormIssue = async (
  formId: string,
  formTitle: string,
  count: number,
): Promise<void> => {
  return ApiService.get<FormIssueDto[]>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/issue/download`,
  ).then(({ data }) => {
    const csvGenerator = new IssueCsvGenerator(count)

    data.forEach((issue) => {
      csvGenerator.addLineFromIssue(issue)
    })

    csvGenerator.triggerFileDownload(`${formTitle}-${formId}-issue.csv`)
  })
}

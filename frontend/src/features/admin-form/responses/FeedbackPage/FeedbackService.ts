import React from 'react'

import { FormFeedbackMetaDto } from '~shared/types/form/'

import { BxsAngry, BxsHappy, BxsMeh, BxsSad, BxsSmile } from '~assets/icons'
import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../../common/AdminViewFormService'

export const getFormFeedback = async ({
  formId,
}: {
  formId: string
}): Promise<FormFeedbackMetaDto> => {
  return ApiService.get<FormFeedbackMetaDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/feedback`,
  ).then(({ data }) => data)
}

export const getSmileyFromScore = (
  averageScore: number,
): React.FunctionComponent => {
  if (averageScore < 1) {
    return BxsAngry
  } else if (averageScore < 2) {
    return BxsSad
  } else if (averageScore < 3) {
    return BxsMeh
  } else if (averageScore < 4) {
    return BxsSmile
  } else {
    return BxsHappy
  }
}

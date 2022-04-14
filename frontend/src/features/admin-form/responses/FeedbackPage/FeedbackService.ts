import React from 'react'

import { FormFeedbackMetaDto } from '~shared/types/form/'

import { ReactComponent as AngrySvg } from '~assets/svgs/smileys/angry.svg'
import { ReactComponent as HappySvg } from '~assets/svgs/smileys/happy.svg'
import { ReactComponent as NeutralSvg } from '~assets/svgs/smileys/neutral.svg'
import { ReactComponent as OkSvg } from '~assets/svgs/smileys/ok.svg'
import { ReactComponent as SadSvg } from '~assets/svgs/smileys/sad.svg'
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
    return AngrySvg
  } else if (averageScore < 2) {
    return SadSvg
  } else if (averageScore < 3) {
    return NeutralSvg
  } else if (averageScore < 4) {
    return OkSvg
  } else {
    return HappySvg
  }
}

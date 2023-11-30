import { MultirespondentFormLoadedDto } from 'src/types/api/multirespondent_submission'

import {
  SubmissionErrorDto,
  SubmissionResponseDto,
} from '../../../../../shared/types'
import { FormCompleteDto } from '../../../../types/api'
import { ControllerHandler } from '../../core/core.types'
import { CreateFormsgAndRetrieveFormMiddlewareHandlerType } from '../encrypt-submission/encrypt-submission.types'

export type UpdateMultirespondentSubmissionHandlerType = ControllerHandler<
  { formId: string; submissionId: string },
  SubmissionResponseDto | SubmissionErrorDto
>

export type UpdateMultirespondentSubmissionHandlerRequest =
  Parameters<UpdateMultirespondentSubmissionHandlerType>[0] & {
    formsg: FormCompleteDto
  }

export type CreateFormsgAndRetrieveFormMiddlewareHandlerRequest =
  Parameters<CreateFormsgAndRetrieveFormMiddlewareHandlerType>[0] & {
    formsg?: MultirespondentFormLoadedDto
  }

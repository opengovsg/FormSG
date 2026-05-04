import { IPopulatedForm } from '../../../../types'
import {
  createLoggerWithLabel,
  CustomLoggerParams,
} from '../../../config/logger'
import { Middleware } from '../../../utils/pipeline-middleware'
import { FormRespondentNotWhitelistedError } from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import { mapRouteError } from '../submission.utils'

import {
  ProcessedMultirespondentSubmissionHandlerType,
  SubmitMultirespondentFormHandlerRequest,
} from './multirespondent-submission.types'

const logger = createLoggerWithLabel(module)

type FormSubmissionPipelineContext = {
  req: SubmitMultirespondentFormHandlerRequest
  res: Parameters<ProcessedMultirespondentSubmissionHandlerType>[1]
  logMeta: CustomLoggerParams['meta']
  form: IPopulatedForm
}

export const ensureSubmitterIdIsWhitelisted: Middleware<
  FormSubmissionPipelineContext
> = async ({ logMeta, res, form, req }, next) => {
  const submitterId = req.formsg?.encryptedPayload?.submitterId

  const hasRespondentNotWhitelistedErrorResult =
    await FormService.checkHasRespondentNotWhitelistedFailure(form, submitterId)

  if (hasRespondentNotWhitelistedErrorResult.isErr()) {
    const error = hasRespondentNotWhitelistedErrorResult.error
    logger.error({
      message: error.message,
      meta: logMeta,
      error,
    })

    const { statusCode, errorMessage } = mapRouteError(error)
    res.status(statusCode).json({ message: errorMessage })
    return
  }

  const isRespondentNotWhitelisted =
    hasRespondentNotWhitelistedErrorResult.value

  if (isRespondentNotWhitelisted) {
    const formRespondentNotWhitelistedError =
      new FormRespondentNotWhitelistedError()
    logger.error({
      message: formRespondentNotWhitelistedError.message,
      meta: logMeta,
      error: formRespondentNotWhitelistedError,
    })

    const { statusCode, errorMessage } = mapRouteError(
      formRespondentNotWhitelistedError,
    )
    res.status(statusCode).json({ message: errorMessage })
    return
  }

  return next()
}

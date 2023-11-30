import { NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'

import { MultirespondentFormLoadedDto } from 'src/types/api/multirespondent_submission'

import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import * as FeatureFlagService from '../../feature-flags/feature-flags.service'
import * as FormService from '../../form/form.service'
import { FormsgReqBodyExistsError } from '../encrypt-submission/encrypt-submission.errors'
import { CreateFormsgAndRetrieveFormMiddlewareHandlerType } from '../encrypt-submission/encrypt-submission.types'
import { mapRouteError } from '../encrypt-submission/encrypt-submission.utils'

import { checkFormIsMultirespondent } from './multirespondent-submission.service'
import { CreateFormsgAndRetrieveFormMiddlewareHandlerRequest } from './multirespondent-submission.types'

const logger = createLoggerWithLabel(module)

/**
 * Creates formsg namespace in req.body and populates it with featureFlags, formDef and encryptedFormDef.
 */
export const createFormsgAndRetrieveForm = async (
  req: CreateFormsgAndRetrieveFormMiddlewareHandlerRequest,
  res: Parameters<CreateFormsgAndRetrieveFormMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const { formId } = req.params

  const logMeta = {
    action: 'createFormsgAndRetrieveForm',
    ...createReqMeta(req),
    formId,
  }

  // Step 1: Create formsg namespace in req.body
  if (req.formsg) return res.send(new FormsgReqBodyExistsError())
  const formsg = {} as MultirespondentFormLoadedDto

  // Step 2: Retrieve feature flags
  const featureFlagsListResult = await FeatureFlagService.getEnabledFlags()

  if (featureFlagsListResult.isErr()) {
    logger.error({
      message: 'Error occurred whilst retrieving enabled feature flags',
      meta: logMeta,
      error: featureFlagsListResult.error,
    })
  } else {
    formsg.featureFlags = featureFlagsListResult.value
  }

  // Step 3a: Retrieve form
  const formResult = await FormService.retrieveFullFormById(formId)
  if (formResult.isErr()) {
    logger.warn({
      message: 'Failed to retrieve form from database',
      meta: logMeta,
      error: formResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(formResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Step 3b: Set formsg.formDef in req.body
  const formDef = formResult.value
  formsg.formDef = formDef

  // Step 4a: Check if form is encrypt mode
  const checkFormIsMultirespondentResult = checkFormIsMultirespondent(formDef)
  if (checkFormIsMultirespondentResult.isErr()) {
    logger.error({
      message:
        'Trying to submit non-multirespondent submission on multirespondent submission endpoint',
      meta: logMeta,
    })
    const { statusCode, errorMessage } = mapRouteError(
      checkFormIsMultirespondentResult.error,
    )
    return res.status(statusCode).json({
      message: errorMessage,
    })
  }

  // Step 4b: Set formsg.encryptedFormDef in req.body
  formsg.encryptedFormDef = checkFormIsMultirespondentResult.value

  // Step 5: Check if form has public key
  if (!formDef.publicKey) {
    logger.warn({
      message: 'Form does not have a public key',
      meta: logMeta,
    })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Form does not have a public key',
    })
  }

  req.formsg = formsg

  return next()
}

import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { FormAuthType } from '../../../../../shared/types'
import { IFormFeedbackSchema } from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'
import getFormModel from '../../../models/form.server.model'
import getFormFeedbackModel from '../../../models/form_feedback.server.model'
import { DatabaseError } from '../../core/core.errors'
import { MYINFO_COOKIE_NAME } from '../../myinfo/myinfo.constants'
import { SGID_COOKIE_NAME } from '../../sgid/sgid.constants'
import { JwtName } from '../../spcp/spcp.types'
import { FormNotFoundError } from '../form.errors'

import { Metatags } from './public-form.types'

const FormFeedbackModel = getFormFeedbackModel(mongoose)
const FormModel = getFormModel(mongoose)
const logger = createLoggerWithLabel(module)

/**
 * Inserts given feedback to the database.
 * @param formId the formId to insert the feedback for
 * @param submissionId the submissionId of the form submission that the feedback is for
 * @param rating the feedback rating to insert
 * @param comment the comment accompanying the feedback
 * @returns ok(true) if successfully inserted
 * @returns err(DatabaseError) on database error
 */
export const insertFormFeedback = ({
  formId,
  submissionId,
  rating,
  comment,
}: {
  formId: string
  submissionId: string
  rating: number
  comment?: string
}): ResultAsync<IFormFeedbackSchema, FormNotFoundError | DatabaseError> => {
  if (!mongoose.Types.ObjectId.isValid(formId)) {
    return errAsync(new FormNotFoundError())
  }

  return ResultAsync.fromPromise(
    FormFeedbackModel.create({
      formId,
      submissionId,
      rating,
      comment,
    }),
    (error) => {
      logger.error({
        message: 'Database error when creating form feedback document',
        meta: {
          action: 'submitFeedback',
          formId,
        },
        error,
      })

      return new DatabaseError('Form feedback could not be created')
    },
  )
}

/**
 * Returns the cookie name based on auth type
 * Valid AuthTypes are SP / CP / MyInfo / SGID
 */
export const getCookieNameByAuthType = (
  authType:
    | FormAuthType.SP
    | FormAuthType.CP
    | FormAuthType.MyInfo
    | FormAuthType.SGID,
): string => {
  switch (authType) {
    case FormAuthType.MyInfo:
      return MYINFO_COOKIE_NAME
    case FormAuthType.SGID:
      return SGID_COOKIE_NAME
    default:
      return JwtName[authType]
  }
}

/**
 * Creates metatags for given formId.
 * @param formId the id of the form to use for metadata
 * @param appUrl the appUrl to inject into the created metatags
 * @param imageBaseUrl the base URL of images that metatags points to
 * @returns ok(metatags) if metatag is created successfully
 * @returns err(FormNotFoundError) if form cannot be retrieved with given formId
 * @returns err(DatabaseError) if errors occur whilst querying database
 */
export const createMetatags = ({
  formId,
  appUrl,
  imageBaseUrl,
}: {
  formId: string
  appUrl: string
  imageBaseUrl: string
}): ResultAsync<Metatags, FormNotFoundError | DatabaseError> => {
  return ResultAsync.fromPromise(FormModel.findById(formId).exec(), (error) => {
    logger.error({
      message: 'Database error when retrieving form',
      meta: {
        action: 'getMetatags',
        formId,
      },
      error,
    })
    return new DatabaseError()
  }).andThen((form) => {
    if (!form) {
      return errAsync(new FormNotFoundError())
    }

    const metatags: Metatags = {
      title: form.title,
      description: form.startPage?.paragraph,
      appUrl,
      images: [
        `${imageBaseUrl}/public/modules/core/img/og/img_metatag.png`,
        `${imageBaseUrl}/public/modules/core/img/og/logo-vertical-color.png`,
      ],
      twitterImage: `${imageBaseUrl}/public/modules/core/img/og/logo-vertical-color.png`,
    }
    return okAsync(metatags)
  })
}

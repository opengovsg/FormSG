import { Joi } from 'celebrate'

import { BasicField } from '../../../../shared/types'

export const sharedSubmissionParams = {
  responses: Joi.array()
    .items(
      Joi.object()
        .keys({
          _id: Joi.string().required(),
          question: Joi.string(),
          fieldType: Joi.string()
            .required()
            .valid(...Object.values(BasicField)),
          answer: Joi.string().allow(''),
          answerArray: Joi.array(),
          filename: Joi.string(), // filename or quarantine bucket object key where file has been uploaded to
          content: Joi.binary(),
          isHeader: Joi.boolean(),
          myInfo: Joi.object(),
          signature: Joi.string().allow(''),
        })
        .xor('answer', 'answerArray') // only answer or answerArray can be present at once
        .with('filename', 'content'), // if filename is present, content must be present
    )
    .required(),
  responseMetadata: Joi.object({
    responseTimeMs: Joi.number(),
    numVisibleFields: Joi.number(),
  }),
}

/**
 * 60 seconds = 1 minute. The expiry time for presigned POST URLs.
 */
export const PRESIGNED_ATTACHMENT_POST_EXPIRY_SECS = 60

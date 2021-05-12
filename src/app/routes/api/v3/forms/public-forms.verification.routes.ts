import { Router } from 'express'

import * as VerificationController from '../../../../modules/verification/verification.controller'

export const PublicFormsVerificationRouter = Router()

/**
 * Route for creating a verification transaction instance
 * @group fieldverifications
 * @route POST /forms/:formId/fieldverifications
 */
PublicFormsVerificationRouter.route(
  '/:formId([a-fA-F0-9]{24})/fieldverifications',
).post(VerificationController.handleCreateTransactionWithFieldId)

/**
 * Route for retrieving a transaction by its id
 * @group fieldverifications
import { ObjectId } from 'bson-ext'
 * @route GET /forms/:formId/fieldverifications/:id
 * @returns 200 with transactionId/formId and expiry time when transaction exists
 * @returns 404 when the transaction could not be found
 * @returns 500 when database error occurs
 */
PublicFormsVerificationRouter.route(
  '/:formId([a-fA-F0-9]{24})/fieldverifications/:transactionId([a-fA-F0-9]{24})',
).get(VerificationController.handleGetTransactionMetadata)

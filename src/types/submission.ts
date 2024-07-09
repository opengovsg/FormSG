import { Cursor as QueryCursor, Document, Model, QueryOptions } from 'mongoose'

import { EmailSubmissionContent } from 'src/app/modules/submission/email-submission/email-submission.types'
import { EncryptSubmissionContent } from 'src/app/modules/submission/encrypt-submission/encrypt-submission.types'
import { PaymentWebhookEventObject } from 'src/app/modules/webhook/webhook.types'

import {
  EmailModeSubmissionBase,
  MultirespondentSubmissionBase,
  StorageModeSubmissionBase,
  SubmissionBase,
  SubmissionMetadata,
  SubmissionType,
  WebhookResponse,
} from '../../shared/types/submission'

import { IFormSchema } from './form'
import { IPaymentSchema } from './payment'

export interface WebhookData {
  formId: string
  submissionId: string
  encryptedContent: IEncryptedSubmissionSchema['encryptedContent']
  verifiedContent: IEncryptedSubmissionSchema['verifiedContent']
  version: IEncryptedSubmissionSchema['version']
  created: IEncryptedSubmissionSchema['created']
  attachmentDownloadUrls: Record<string, string>
  paymentContent?: PaymentWebhookEventObject | object
}

export interface WebhookView {
  data: WebhookData
}

export type SubmissionWebhookInfo = {
  webhookUrl: string
  isRetryEnabled: boolean
  webhookView: WebhookView
}

export type FindFormsWithSubsAboveResult = {
  _id: IFormSchema['_id']
  count: number
}

export interface IPopulatedWebhookSubmission
  extends IEncryptedSubmissionSchema {
  form: {
    _id: IFormSchema['_id']
    webhook: IFormSchema['webhook']
  }
  paymentId: IPaymentSchema
}

export interface ISubmissionSchema extends SubmissionBase, Document {
  // `any` allows for population and correct typing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentId: any

  created?: Date
}

export type IPendingSubmissionSchema = ISubmissionSchema

export type SaveIfSubmitterIdIsUniqueType = EmailSaveIfSubmitterIdIsUniqueType &
  EncryptSaveIfSubmitterIdIsUniqueType

type EmailSaveIfSubmitterIdIsUniqueType = (
  formId: string,
  submitterId: string,
  submissionContent: EmailSubmissionContent,
) => Promise<IEmailSubmissionSchema | null>

type EncryptSaveIfSubmitterIdIsUniqueType = (
  formId: string,
  submitterId: string,
  submissionContent: EncryptSubmissionContent,
) => Promise<IEncryptedSubmissionSchema | null>

export interface ISubmissionModel extends Model<ISubmissionSchema> {
  findFormsWithSubsAbove(
    minSubCount: number,
  ): Promise<FindFormsWithSubsAboveResult[]>
  /**
   * Creates a new submission only if provided submitterId is unique.
   * This method ensures that isSingleSubmission is enforced.
   * @param submitterId uniquely identifies the submitter
   * @returns created submission if successful, null otherwise
   */
  saveIfSubmitterIdIsUnique: SaveIfSubmitterIdIsUniqueType
}

export interface IEmailSubmissionSchema
  extends EmailModeSubmissionBase,
    ISubmissionSchema {
  // Allows for population and correct typing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any
  submissionType: SubmissionType.Email
  getWebhookView(): Promise<null>
}
export interface IEncryptedSubmissionSchema
  extends StorageModeSubmissionBase,
    ISubmissionSchema {
  // Allows for population and correct typing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentId: any

  submissionType: SubmissionType.Encrypt
  getWebhookView(): Promise<WebhookView>
}
export interface IMultirespondentSubmissionSchema
  extends MultirespondentSubmissionBase,
    ISubmissionSchema {
  // Allows for population and correct typing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any
  submissionType: SubmissionType.Multirespondent
  getWebhookView(): Promise<null>
  mrfVersion: number
}

// When retrieving from database, the attachmentMetadata type becomes an object
// instead of a Map.
// Due to schema changes, some objects may not have attachmentMetadata key.
export type StorageModeSubmissionCursorData = Pick<
  IEncryptedSubmissionSchema,
  | 'submissionType'
  | 'encryptedContent'
  | 'verifiedContent'
  | 'paymentId'
  | 'created'
  | 'id'
  | 'version'
> & { attachmentMetadata?: Record<string, string> } & Document

export type MultirespondentSubmissionCursorData = Pick<
  IMultirespondentSubmissionSchema,
  | 'form_fields'
  | 'form_logics'
  | 'submissionType'
  | 'encryptedSubmissionSecretKey'
  | 'encryptedContent'
  | 'created'
  | 'id'
  | 'version'
  | 'mrfVersion'
> & { attachmentMetadata?: Record<string, string> } & Document

export type SubmissionCursorData =
  | StorageModeSubmissionCursorData
  | MultirespondentSubmissionCursorData

export type StorageModeSubmissionData = {
  submissionType: SubmissionType.Encrypt
} & Pick<
  IEncryptedSubmissionSchema,
  | 'encryptedContent'
  | 'verifiedContent'
  | 'attachmentMetadata'
  | 'paymentId'
  | 'created'
  | 'version'
> &
  Document

export type MultirespondentSubmissionData = {
  submissionType: SubmissionType.Multirespondent
} & Pick<
  IMultirespondentSubmissionSchema,
  | 'form_fields'
  | 'form_logics'
  | 'workflow'
  | 'submissionPublicKey'
  | 'encryptedSubmissionSecretKey'
  | 'encryptedContent'
  | 'attachmentMetadata'
  | 'created'
  | 'version'
  | 'workflowStep'
  | 'mrfVersion'
> &
  Document

export type SubmissionData =
  | StorageModeSubmissionData
  | MultirespondentSubmissionData

export type IEmailSubmissionModel = Model<IEmailSubmissionSchema> &
  ISubmissionModel
export type IEncryptSubmissionModel = Model<IEncryptedSubmissionSchema> &
  ISubmissionModel & {
    /**
     * Return submission metadata for a single submissionId of form with formId.
     * @param formId formId to filter submissions for
     * @param submissionId specific submissionId to retrieve metadata for
     *
     * @returns submission metadata if available, `null` otherwise.
     */
    findSingleMetadata(
      formId: string,
      submissionId: string,
    ): Promise<SubmissionMetadata | null>

    /**
     * Returns all submission metadata of the form for the given formId. The
     * metadata returned is offset by the page and the pageSize options.
     * @param formId the form id to return submission metadata for
     * @param options.page the page of metadata list to return
     * @param options.pageSize the number of metadata per page
     *
     * @returns limited list of metadata, along with the total number of metadata count
     */
    findAllMetadataByFormId(
      formId: string,
      params?: { page?: number; pageSize?: number },
    ): Promise<{
      metadata: SubmissionMetadata[]
      count: number
    }>

    /**
     * Returns a cursor for all submissions of the given formId. May further be
     * limited by a given date range provided both dateRange.startDate and
     * dateRange.endDate is valid.
     * @param formId the form id to return the submissions cursor for
     * @param dateRange optional. If provided, will limit the submissions to the given range
     * @returns a cursor to the submissions retrieved
     */
    getSubmissionCursorByFormId(
      formId: string,
      dateRange: {
        startDate?: string
        endDate?: string
      },
    ): QueryCursor<
      StorageModeSubmissionCursorData,
      QueryOptions<ISubmissionModel>
    >

    findEncryptedSubmissionById(
      formId: string,
      submissionId: string,
    ): Promise<StorageModeSubmissionData | null>

    /**
     * Adds a record of a webhook response to a submission
     * @param submissionId ID of submission to update
     * @param webhookResponse Response data to push
     */
    addWebhookResponse(
      submissionId: string,
      webhookResponse: WebhookResponse,
    ): Promise<IEncryptedSubmissionSchema | null>

    /**
     * Retrieves webhook-related info for a given submission.
     * @param submissionId
     * @returns Object containing webhook destination and data
     */
    retrieveWebhookInfoById(
      submissionId: string,
    ): Promise<SubmissionWebhookInfo | null>
  }

export type IMultirespondentSubmissionModel =
  Model<IMultirespondentSubmissionSchema> &
    ISubmissionModel & {
      /**
       * Return submission metadata for a single submissionId of form with formId.
       * @param formId formId to filter submissions for
       * @param submissionId specific submissionId to retrieve metadata for
       *
       * @returns submission metadata if available, `null` otherwise.
       */
      findSingleMetadata(
        formId: string,
        submissionId: string,
      ): Promise<SubmissionMetadata | null>

      /**
       * Returns all submission metadata of the form for the given formId. The
       * metadata returned is offset by the page and the pageSize options.
       * @param formId the form id to return submission metadata for
       * @param options.page the page of metadata list to return
       * @param options.pageSize the number of metadata per page
       *
       * @returns limited list of metadata, along with the total number of metadata count
       */
      findAllMetadataByFormId(
        formId: string,
        params?: { page?: number; pageSize?: number },
      ): Promise<{
        metadata: SubmissionMetadata[]
        count: number
      }>

      /**
       * Returns a cursor for all submissions of the given formId. May further be
       * limited by a given date range provided both dateRange.startDate and
       * dateRange.endDate is valid.
       * @param formId the form id to return the submissions cursor for
       * @param dateRange optional. If provided, will limit the submissions to the given range
       * @returns a cursor to the submissions retrieved
       */
      getSubmissionCursorByFormId(
        formId: string,
        dateRange: {
          startDate?: string
          endDate?: string
        },
      ): QueryCursor<MultirespondentSubmissionCursorData>

      findEncryptedSubmissionById(
        formId: string,
        submissionId: string,
      ): Promise<MultirespondentSubmissionData | null>
    }

export interface IWebhookResponseSchema extends WebhookResponse, Document {}

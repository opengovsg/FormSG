import { Cursor as QueryCursor, Document, Model, QueryOptions } from 'mongoose'

import {
  EmailModeSubmissionBase,
  StorageModeSubmissionBase,
  StorageModeSubmissionMetadata,
  SubmissionBase,
  SubmissionType,
  WebhookResponse,
} from '../../shared/types/submission'

import { IFormSchema } from './form'

export interface WebhookData {
  formId: string
  submissionId: string
  encryptedContent: IEncryptedSubmissionSchema['encryptedContent']
  verifiedContent: IEncryptedSubmissionSchema['verifiedContent']
  version: IEncryptedSubmissionSchema['version']
  created: IEncryptedSubmissionSchema['created']
  attachmentDownloadUrls: Record<string, string>
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
}

export interface ISubmissionSchema extends SubmissionBase, Document {
  // Allows for population and correct typing
  form: any
  created?: Date
}

export type IPendingSubmissionSchema = ISubmissionSchema

export interface ISubmissionModel extends Model<ISubmissionSchema> {
  findFormsWithSubsAbove(
    minSubCount: number,
  ): Promise<FindFormsWithSubsAboveResult[]>
}

export interface IEmailSubmissionSchema
  extends EmailModeSubmissionBase,
    ISubmissionSchema {
  // Allows for population and correct typing
  form: any
  submissionType: SubmissionType.Email
  getWebhookView(): null
}
export interface IEncryptedSubmissionSchema
  extends StorageModeSubmissionBase,
    ISubmissionSchema {
  // Allows for population and correct typing
  form: any
  submissionType: SubmissionType.Encrypt
  getWebhookView(): WebhookView
}

// When retrieving from database, the attachmentMetadata type becomes an object
// instead of a Map.
// Due to schema changes, some objects may not have attachmentMetadata key.
export type SubmissionCursorData = Pick<
  IEncryptedSubmissionSchema,
  | 'encryptedContent'
  | 'verifiedContent'
  | 'paymentId'
  | 'created'
  | 'id'
  | 'version'
> & { attachmentMetadata?: Record<string, string> } & Document

export type SubmissionData = Pick<
  IEncryptedSubmissionSchema,
  | 'encryptedContent'
  | 'verifiedContent'
  | 'attachmentMetadata'
  | 'paymentId'
  | 'created'
  | 'version'
> &
  Document

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
    ): Promise<StorageModeSubmissionMetadata | null>

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
      metadata: StorageModeSubmissionMetadata[]
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
    ): QueryCursor<SubmissionCursorData, QueryOptions<ISubmissionModel>>

    findEncryptedSubmissionById(
      formId: string,
      submissionId: string,
    ): Promise<SubmissionData | null>

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

export interface IWebhookResponseSchema extends WebhookResponse, Document {}

import { Document, Model, QueryCursor } from 'mongoose'

import { MyInfoAttribute } from './field'
import { AuthType, IFormSchema } from './form'

export enum SubmissionType {
  Email = 'emailSubmission',
  Encrypt = 'encryptSubmission',
}

export type SubmissionMetadata = {
  number: number
  refNo: IEncryptedSubmissionSchema['_id']
  submissionTime: string
}

export type EncryptedSubmissionDto = {
  refNo: string
  submissionTime: string
  content: string
  verified?: string
  attachmentMetadata: Record<string, string>
  version: number
}

export type SubmissionMetadataList = {
  metadata: SubmissionMetadata[]
  count: number
}
export interface ISubmission {
  form: IFormSchema['_id']
  authType?: AuthType
  myInfoFields?: MyInfoAttribute[]
  submissionType: SubmissionType
  created?: Date
  lastModified?: Date
  recipientEmails?: string[]
  responseHash?: string
  responseSalt?: string
  hasBounced?: boolean
  encryptedContent?: string
  verifiedContent?: string
  version?: number
  attachmentMetadata?: Map<string, string>
  webhookResponses?: IWebhookResponse[]
}

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

export interface IPopulatedWebhookSubmission
  extends IEncryptedSubmissionSchema {
  form: {
    _id: IFormSchema['_id']
    webhook: IFormSchema['webhook']
  }
}

export interface ISubmissionSchema extends ISubmission, Document {}

export type FindFormsWithSubsAboveResult = {
  _id: IFormSchema['_id']
  count: number
}

export interface ISubmissionModel extends Model<ISubmissionSchema> {
  findFormsWithSubsAbove(
    minSubCount: number,
  ): Promise<FindFormsWithSubsAboveResult[]>
}

export interface IEmailSubmission extends ISubmission {
  recipientEmails: string[]
  responseHash: string
  responseSalt: string
  hasBounced?: boolean
  encryptedContent: never
  verifiedContent: never
  version: never
  attachmentMetadata: never
  webhookResponses: never
  getWebhookView(): null
}

export interface IEmailSubmissionSchema extends IEmailSubmission, Document {}

export interface IEncryptedSubmission extends ISubmission {
  recipientEmails: never
  responseHash: never
  responseSalt: never
  hasBounced: never
  encryptedContent: string
  verifiedContent?: string
  version: number
  attachmentMetadata?: Map<string, string>
  webhookResponses?: IWebhookResponse[]
  getWebhookView(): WebhookView
}

export interface IEncryptedSubmissionSchema
  extends IEncryptedSubmission,
    Document {}

export interface IWebhookResponse {
  webhookUrl: string
  signature: string
  response: {
    status: number
    headers: string
    data: string
  }
}

// When retrieving from database, the attachmentMetadata type becomes an object
// instead of a Map.
// Due to schema changes, some objects may not have attachmentMetadata key.
export type SubmissionCursorData = Pick<
  IEncryptedSubmissionSchema,
  'encryptedContent' | 'verifiedContent' | 'created' | 'id' | 'version'
> & { attachmentMetadata?: Record<string, string> } & Document

export type SubmissionData = Pick<
  IEncryptedSubmissionSchema,
  | 'encryptedContent'
  | 'verifiedContent'
  | 'attachmentMetadata'
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
    ): QueryCursor<SubmissionCursorData>

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
      webhookResponse: IWebhookResponse,
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

export interface IWebhookResponseSchema extends IWebhookResponse, Document {}

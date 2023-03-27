import { Mongoose } from 'mongoose'

import {
  IEmailSubmissionModel,
  IEmailSubmissionSchema,
  IEncryptedSubmissionSchema,
  IEncryptSubmissionModel,
  ISubmissionModel,
  ISubmissionSchema,
} from 'src/types'

import { SubmissionType } from '../../../shared/types'

import {
  EmailSubmissionSchema,
  EncryptSubmissionSchema,
  SubmissionSchema,
} from './submission.server.model'

export const PENDING_SUBMISSION_SCHEMA_ID = 'PendingSubmission'
const EMAIL_PENDING_SUBMISSION_SCHEMA_ID = 'EmailPendingSubmission'
const ENCRYPT_PENDING_SUBMISSION_SCHEMA_ID = 'EncryptPendingSubmission'

const compilePendingSubmissionModel = (db: Mongoose): ISubmissionModel => {
  const PendingSubmission = db.model<ISubmissionSchema, ISubmissionModel>(
    PENDING_SUBMISSION_SCHEMA_ID,
    SubmissionSchema,
  )
  PendingSubmission.discriminator(
    EMAIL_PENDING_SUBMISSION_SCHEMA_ID,
    EmailSubmissionSchema,
    SubmissionType.Email,
  )
  PendingSubmission.discriminator(
    ENCRYPT_PENDING_SUBMISSION_SCHEMA_ID,
    EncryptSubmissionSchema,
    SubmissionType.Encrypt,
  )
  return PendingSubmission
}

const getPendingSubmissionModel = (db: Mongoose): ISubmissionModel => {
  try {
    return db.model<ISubmissionSchema, ISubmissionModel>(
      PENDING_SUBMISSION_SCHEMA_ID,
    )
  } catch {
    return compilePendingSubmissionModel(db)
  }
}

export const getEmailPendingSubmissionModel = (
  db: Mongoose,
): IEmailSubmissionModel => {
  getPendingSubmissionModel(db)
  return db.model<IEmailSubmissionSchema, IEmailSubmissionModel>(
    EMAIL_PENDING_SUBMISSION_SCHEMA_ID,
  )
}

export const getEncryptPendingSubmissionModel = (
  db: Mongoose,
): IEncryptSubmissionModel => {
  getPendingSubmissionModel(db)
  return db.model<IEncryptedSubmissionSchema, IEncryptSubmissionModel>(
    ENCRYPT_PENDING_SUBMISSION_SCHEMA_ID,
  )
}
export default getPendingSubmissionModel

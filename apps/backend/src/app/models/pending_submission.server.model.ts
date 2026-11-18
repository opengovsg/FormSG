import { SubmissionType } from 'formsg-shared/types'
import { Mongoose } from 'mongoose'

import {
  IEmailSubmissionModel,
  IEmailSubmissionSchema,
  IEncryptedSubmissionSchema,
  IEncryptSubmissionModel,
  IMultirespondentSubmissionModel,
  IMultirespondentSubmissionSchema,
  ISubmissionModel,
  ISubmissionSchema,
} from 'src/types'

import {
  EmailSubmissionSchema,
  EncryptSubmissionSchema,
  MultirespondentSubmissionSchema,
  SubmissionSchema,
} from './submission.server.model'

export const PENDING_SUBMISSION_SCHEMA_ID = 'PendingSubmission'
const EMAIL_PENDING_SUBMISSION_SCHEMA_ID = 'EmailPendingSubmission'
const ENCRYPT_PENDING_SUBMISSION_SCHEMA_ID = 'EncryptPendingSubmission'
const MULTIRESPONDENT_PENDING_SUBMISSION_SCHEMA_ID =
  'MultirespondentPendingSubmission'

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
  PendingSubmission.discriminator(
    MULTIRESPONDENT_PENDING_SUBMISSION_SCHEMA_ID,
    MultirespondentSubmissionSchema,
    SubmissionType.Multirespondent,
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

export const getMultirespondentPendingSubmissionModel = (
  db: Mongoose,
): IMultirespondentSubmissionModel => {
  getPendingSubmissionModel(db)
  return db.model<
    IMultirespondentSubmissionSchema,
    IMultirespondentSubmissionModel
  >(MULTIRESPONDENT_PENDING_SUBMISSION_SCHEMA_ID)
}
export default getPendingSubmissionModel

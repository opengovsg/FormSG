import { Mongoose } from 'mongoose'
import { SubmissionType } from 'shared/types'

import { ISubmissionModel, ISubmissionSchema } from 'src/types'

import {
  EmailSubmissionSchema,
  EncryptSubmissionSchema,
  SubmissionSchema,
} from './submission.server.model'

export const PENDING_SUBMISSION_SCHEMA_ID = 'PendingSubmission'

const compilePendingSubmissionModel = (db: Mongoose): ISubmissionModel => {
  const PendingSubmission = db.model<ISubmissionSchema, ISubmissionModel>(
    PENDING_SUBMISSION_SCHEMA_ID,
    SubmissionSchema,
  )
  PendingSubmission.discriminator(SubmissionType.Email, EmailSubmissionSchema)
  PendingSubmission.discriminator(
    SubmissionType.Encrypt,
    EncryptSubmissionSchema,
  )
  return db.model<ISubmissionSchema, ISubmissionModel>(
    PENDING_SUBMISSION_SCHEMA_ID,
    SubmissionSchema,
  )
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

export default getPendingSubmissionModel

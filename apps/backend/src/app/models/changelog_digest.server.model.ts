import { Document, Model, Mongoose, Schema } from 'mongoose'

export const CHANGELOG_DIGEST_SCHEMA_ID = 'ChangelogDigest'

/** One item as it appeared in a sent digest. */
export type SentDigestItem = {
  title: string
  body: string
  sourcePullRequests: number[]
}

export interface IChangelogDigestSchema extends Document {
  /** When the digest was sent. */
  sentAt: Date
  /**
   * The window the digest covered. `until` is the watermark: the next cycle
   * reads pull requests merged after it.
   */
  window: { since: string; until: string }
  /** What the reader was told, kept so a later cycle can avoid repeating it. */
  items: SentDigestItem[]
  /** Where it went. A preview send and a real send are both recorded. */
  recipients: string[]
}

export interface IChangelogDigestModel extends Model<IChangelogDigestSchema> {
  /**
   * The most recently sent digest, or `null` if none has ever been sent.
   *
   * This is the whole reason the collection exists: a cycle covers everything
   * merged since the last digest *went out*, not since the last time the job
   * ran. A cycle that finds too little to be worth sending records nothing, so
   * the next one reconsiders the same changes alongside whatever is new.
   */
  getLastSent(): Promise<IChangelogDigestSchema | null>
}

const ChangelogDigestSchema = new Schema<
  IChangelogDigestSchema,
  IChangelogDigestModel
>({
  sentAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  window: {
    since: { type: String, required: true },
    until: { type: String, required: true },
  },
  items: [
    {
      title: { type: String, required: true },
      body: { type: String, required: true },
      sourcePullRequests: [{ type: Number }],
    },
  ],
  recipients: [{ type: String }],
})

// Every read of this collection is "the latest one", and there will never be
// many documents. The index is here so that stays true if the digest runs for
// years.
ChangelogDigestSchema.index({ sentAt: -1 })

ChangelogDigestSchema.statics.getLastSent = async function (
  this: IChangelogDigestModel,
) {
  return this.findOne().sort({ sentAt: -1 }).exec()
}

const getChangelogDigestModel = (db: Mongoose): IChangelogDigestModel => {
  try {
    return db.model(CHANGELOG_DIGEST_SCHEMA_ID) as IChangelogDigestModel
  } catch {
    return db.model<IChangelogDigestSchema, IChangelogDigestModel>(
      CHANGELOG_DIGEST_SCHEMA_ID,
      ChangelogDigestSchema,
    )
  }
}

export default getChangelogDigestModel

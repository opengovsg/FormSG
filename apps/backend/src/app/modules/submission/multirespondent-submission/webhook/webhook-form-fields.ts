import type { FormFieldMeta } from '@opengovsg/formsg-sdk'
import { FormFieldDto } from 'formsg-shared/types'
import { getVerifiedQuestionPrefix } from 'formsg-shared/utils/myinfo-prefix'

import { FormFieldSchema } from 'src/types/field'

/**
 * Question titles from the saved form definition, '[Myinfo] '-prefixed for
 * fields in myInfoReadOnlyFields — the same signal the V1 webhook copy uses,
 * so the two formats cannot disagree. The server strips `question` from
 * stored V4 responses, and the SDK backfills it from this map at decrypt
 * time, so prefixing here hands consumers prefixed question text without any
 * SDK or consumer change.
 */
export const buildWebhookFormFields = (
  fields: (FormFieldDto | FormFieldSchema)[],
  myInfoReadOnlyFieldIds: readonly string[] = [],
): Record<string, Pick<FormFieldMeta, 'question'>> => {
  const readOnly: ReadonlySet<string> = new Set(
    myInfoReadOnlyFieldIds.map(String),
  )
  return Object.fromEntries(
    fields.map((field) => [
      String(field._id),
      {
        // Cast: IAddressCompoundFieldSchema types _id as optional, so the
        // field union does not satisfy MyInfoPrefixCandidate structurally;
        // every saved field carries an id, and the helper only reads
        // _id/myInfo.attr/corppass.attr.
        question: `${getVerifiedQuestionPrefix(
          field as Parameters<typeof getVerifiedQuestionPrefix>[0],
          readOnly,
        )}${field.title}`,
      },
    ]),
  )
}

import { FormFieldDto, LogicDto } from 'formsg-shared/types'
import { flattenV4ToFormFields } from 'formsg-shared/utils/flatten-v4-to-v1'
import { applyMyInfoPrefix } from 'formsg-shared/utils/myinfo-prefix'
import { FieldResponsesV4Input } from 'formsg-shared/utils/v4-answer'
import { err, ok, Result } from 'neverthrow'

import formsgSdk from '../../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../../config/logger'

import { V1ContentProductionError } from './submission-snapshot.errors'

const logger = createLoggerWithLabel(module)

/**
 * Produces the storage-mode-shaped copy of a step submission's content, from
 * the respondent's plaintext, at submit time.
 *
 * Two things make this copy faithful, and both are easy to get subtly wrong:
 *
 * 1. **The form public key, not the submission keypair.** A storage-mode
 *    consumer decrypts with the form secret key it already holds, and holds no
 *    submission secret key at all — which is why the V1 payload ships none.
 *
 * 2. **`formsgSdk.crypto`, not `formsgSdk.cryptoV3`.** The SDK has two
 *    encryption classes and the codebase picks between them by submission
 *    version: storage mode encrypts with `crypto`, an MRF form with
 *    `cryptoV3`. The right key with the wrong class produces a cryptoV3
 *    envelope under the form key, which an unmodified storage-mode consumer
 *    cannot open — a silent, consumer-side failure of exactly the kind this
 *    work exists to prevent.
 *
 * The V1 array itself comes from the shared flatten, which is the single
 * implementation of the V4→V1 conversion: the frontend's admin download path
 * calls the same function, so the wire and the admin's own CSV cannot drift.
 * Question text is injected from the form-definition snapshot passed in, never
 * from the respondent's payload.
 *
 * The `[Myinfo] ` prefix is then applied through the same shared rule the two
 * admin DTO builders use, so an admin's webhook and their own download never
 * disagree about a column name — and `question` is a consumer's join key.
 *
 * It returns a `Result` rather than throwing because the flatten throws on a
 * field type it cannot represent. That has to reject the submission with a
 * real status: the copy can only be made while the plaintext is in hand, so
 * committing without one would leave a submission that can never be delivered.
 */
export const buildV1EncryptedContent = ({
  v4Responses,
  formFields,
  formLogics,
  formPublicKey,
  myInfoReadOnlyFieldIds,
  logMeta,
}: {
  v4Responses: FieldResponsesV4Input
  /**
   * The submission row's own `form_fields` snapshot — never the live form. An
   * admin who renames a field after a submission was made must not change the
   * payload of a submission already delivered, the same reasoning as PIN-02.
   */
  formFields: FormFieldDto[]
  /**
   * The submission row's own `form_logics` snapshot, for the same reason as
   * `formFields`. The shared flatten needs it to resolve `isVisible`, and the
   * admin's own download path passes the row's copy too — so an admin editing
   * the form's logic after the fact cannot make the wire and the CSV disagree
   * about which answers were shown.
   */
  formLogics: LogicDto[]
  formPublicKey: string
  /**
   * Ids of the fields whose answers were read-only MyInfo values for this
   * respondent, as resolved at submit time and persisted on the row. Empty
   * when the step ran and matched nothing, and when it never ran at all —
   * both prefix nothing, which is the correct outcome for a form with no
   * MyInfo auth.
   */
  myInfoReadOnlyFieldIds: readonly string[]
  logMeta: Record<string, unknown>
}): Result<string, V1ContentProductionError> => {
  try {
    const v1Fields = applyMyInfoPrefix(
      flattenV4ToFormFields({ v4Responses, formFields, formLogics }),
      myInfoReadOnlyFieldIds,
    )

    return ok(formsgSdk.crypto.encrypt(v1Fields, formPublicKey))
  } catch (error) {
    logger.error({
      message: 'Failed to produce the V1 copy of a multirespondent submission',
      meta: { action: 'buildV1EncryptedContent', ...logMeta },
      error: error as Error,
    })
    return err(new V1ContentProductionError(undefined, error))
  }
}

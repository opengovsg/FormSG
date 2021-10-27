import { ok, Result } from 'neverthrow'
import { FormFieldResponse } from 'shared/types'

import {
  FieldIdSet,
  getLogicUnitPreventingSubmit as logicGetLogicUnitPreventingSubmit,
  getVisibleFieldIds as logicGetVisibleFieldIds,
} from '../../../shared/utils/logic'
import { IFormDocument, IPreventSubmitLogicSchema } from '../../types'
import { ProcessingError } from '../modules/submission/submission.errors'

export { FieldIdSet } from '../../../shared/utils/logic'

export const getVisibleFieldIds = (
  submission: FormFieldResponse[],
  form: IFormDocument,
): Result<FieldIdSet, ProcessingError> => {
  return ok(logicGetVisibleFieldIds(submission, form))
}

export const getLogicUnitPreventingSubmit = (
  submission: FormFieldResponse[],
  form: IFormDocument,
  visibleFieldIds?: FieldIdSet,
): Result<IPreventSubmitLogicSchema | undefined, ProcessingError> => {
  return ok(
    logicGetLogicUnitPreventingSubmit(submission, form, visibleFieldIds),
  )
}

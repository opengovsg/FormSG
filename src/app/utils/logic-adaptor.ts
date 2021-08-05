import { ok, Result } from 'neverthrow'

import {
  FieldIdSet,
  getLogicUnitPreventingSubmit as logicGetLogicUnitPreventingSubmit,
  getVisibleFieldIds as logicGetVisibleFieldIds,
} from '../../shared/util/logic'
import {
  FieldResponse,
  IFormDocument,
  IPreventSubmitLogicSchema,
} from '../../types'
import { ProcessingError } from '../modules/submission/submission.errors'

export { FieldIdSet } from '../../shared/util/logic'

export const getVisibleFieldIds = (
  submission: FieldResponse[],
  form: IFormDocument,
): Result<FieldIdSet, ProcessingError> => {
  return ok(logicGetVisibleFieldIds(submission, form))
}

export const getLogicUnitPreventingSubmit = (
  submission: FieldResponse[],
  form: IFormDocument,
  visibleFieldIds?: FieldIdSet,
): Result<IPreventSubmitLogicSchema | undefined, ProcessingError> => {
  return ok(
    logicGetLogicUnitPreventingSubmit(submission, form, visibleFieldIds),
  )
}

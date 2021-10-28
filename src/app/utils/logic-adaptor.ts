import { ok, Result } from 'neverthrow'

import {
  FieldIdSet,
  getLogicUnitPreventingSubmit as logicGetLogicUnitPreventingSubmit,
  getVisibleFieldIds as logicGetVisibleFieldIds,
  PickLogicSubset,
} from '../../../shared/utils/logic'
import { FieldResponse } from '../../types'
import { ProcessingError } from '../modules/submission/submission.errors'

import { PreventSubmitLogic } from './../../../shared/types/form/form_logic'

export { FieldIdSet } from '../../shared/util/logic'

export const getVisibleFieldIds = (
  submission: FieldResponse[],
  form: PickLogicSubset,
): Result<FieldIdSet, ProcessingError> => {
  return ok(logicGetVisibleFieldIds(submission, form))
}

export const getLogicUnitPreventingSubmit = (
  submission: FieldResponse[],
  form: PickLogicSubset,
  visibleFieldIds?: FieldIdSet,
): Result<PreventSubmitLogic | undefined, ProcessingError> => {
  return ok(
    logicGetLogicUnitPreventingSubmit(submission, form, visibleFieldIds),
  )
}

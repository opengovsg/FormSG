import { ok, Result } from 'neverthrow'

import { FormDto, PreventSubmitLogicDto } from '../../../shared/types'
import {
  FieldIdSet,
  getLogicUnitPreventingSubmit as logicGetLogicUnitPreventingSubmit,
  getVisibleFieldIds as logicGetVisibleFieldIds,
} from '../../../shared/utils/logic'
import { FieldResponse, IFormDocument } from '../../types'
import { ProcessingError } from '../modules/submission/submission.errors'

export { FieldIdSet } from '../../../shared/utils/logic'

export const getVisibleFieldIds = (
  submission: FieldResponse[],
  form: IFormDocument,
): Result<FieldIdSet, ProcessingError> => {
  return ok(logicGetVisibleFieldIds(submission, form as unknown as FormDto))
}

export const getLogicUnitPreventingSubmit = (
  submission: FieldResponse[],
  form: IFormDocument,
  visibleFieldIds: FieldIdSet,
): Result<PreventSubmitLogicDto | undefined, ProcessingError> => {
  return ok(
    logicGetLogicUnitPreventingSubmit(
      submission,
      form as unknown as FormDto,
      visibleFieldIds,
    ),
  )
}

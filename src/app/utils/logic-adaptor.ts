import { ok, Result } from 'neverthrow'

import { FormDto } from '../../../shared/types'
import { PreventSubmitLogic } from '../../../shared/types/form/form_logic'
import {
  FieldIdSet,
  getLogicUnitPreventingSubmit as logicGetLogicUnitPreventingSubmit,
  getVisibleFieldIds as logicGetVisibleFieldIds,
} from '../../../shared/utils/logic'
import { FieldResponse, IFormDocument } from '../../types'
import { ProcessingError } from '../modules/submission/submission.errors'

export { FieldIdSet } from '../../shared/util/logic'

export const getVisibleFieldIds = (
  submission: FieldResponse[],
  form: IFormDocument,
): Result<FieldIdSet, ProcessingError> => {
  return ok(
    logicGetVisibleFieldIds(
      submission,
      form.toJSON({ virtuals: true }) as unknown as FormDto,
    ),
  )
}

export const getLogicUnitPreventingSubmit = (
  submission: FieldResponse[],
  form: IFormDocument,
  visibleFieldIds?: FieldIdSet,
): Result<PreventSubmitLogic | undefined, ProcessingError> => {
  return ok(
    logicGetLogicUnitPreventingSubmit(
      submission,
      form.toJSON({ virtuals: true }) as unknown as FormDto,
      visibleFieldIds,
    ),
  )
}

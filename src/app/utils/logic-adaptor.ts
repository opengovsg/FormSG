import { err, ok, Result } from 'neverthrow'

import { LOGIC_MAP } from '../../../shared/modules/logic'
import {
  BasicField,
  FieldResponseAnswerMapV3,
  FieldResponsesV3,
  FormDto,
  LogicableField,
  PreventSubmitLogicDto,
  RadioFieldResponsesV3,
  SingleAnswerResponseV3,
} from '../../../shared/types'
import { isNonEmpty } from '../../../shared/utils/isNonEmpty'
import {
  FieldIdSet,
  getLogicUnitPreventingSubmit as logicGetLogicUnitPreventingSubmit,
  getVisibleFieldIds as logicGetVisibleFieldIds,
  type LogicFieldResponse,
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

export const getVisibleFieldIdsV3 = (
  submission: FieldResponsesV3,
  form: Pick<FormDto, '_id' | 'form_fields' | 'form_logics'>,
): Result<FieldIdSet, ProcessingError> =>
  // Convert submission into a form understood by the shared function
  fieldResponsesV3ToLogicFieldResponseTransformer(submission, form.form_fields)
    // Call the shared logic evaluator
    .map((responseData) =>
      logicGetVisibleFieldIds(responseData, form as unknown as FormDto),
    )

export const getLogicUnitPreventingSubmitV3 = (
  submission: FieldResponsesV3,
  form: Pick<FormDto, '_id' | 'form_fields' | 'form_logics'>,
  visibleFieldIds: FieldIdSet,
): Result<PreventSubmitLogicDto | undefined, ProcessingError> =>
  fieldResponsesV3ToLogicFieldResponseTransformer(
    submission,
    form.form_fields,
  ).map((responseData) =>
    logicGetLogicUnitPreventingSubmit(responseData, form, visibleFieldIds),
  )

// Transformer functions

type SingleAnswerLogicableField = Exclude<LogicableField, BasicField.Radio>

const isLogicableField = (args: {
  fieldType: BasicField
  input: FieldResponseAnswerMapV3<BasicField>
}): args is
  | {
      fieldType: SingleAnswerLogicableField
      input: SingleAnswerResponseV3
    }
  | {
      fieldType: BasicField.Radio
      input: RadioFieldResponsesV3
    } => [...LOGIC_MAP.keys()].includes(args.fieldType)

const isNotLogicableField = (args: {
  fieldType: BasicField
  input: FieldResponseAnswerMapV3<BasicField>
}): args is {
  fieldType: Exclude<BasicField, LogicableField>
  input: FieldResponseAnswerMapV3<BasicField>
} => !isLogicableField(args)

const fieldResponsesV3ToLogicFieldResponseTransformer = (
  submission: FieldResponsesV3,
  form_fields: FormDto['form_fields'],
): Result<LogicFieldResponse[], ProcessingError> =>
  Result.combine(
    form_fields.map((ff) => {
      const input = submission[ff._id]?.answer
      if (!input) return ok(null)
      const fieldTypeAndInput = {
        fieldType: ff.fieldType,
        input,
      }
      // Type narrowing to help the typechecker along with complex if-else types
      // Unfortunately, this requires the runtime check where isNotLogicableField
      // is defined as !isLogicableField, allowing the final "else" case to be
      // an unreachable code path.
      if (isNotLogicableField(fieldTypeAndInput)) {
        return ok({ _id: ff._id, fieldType: fieldTypeAndInput.fieldType })
      } else if (isLogicableField(fieldTypeAndInput)) {
        return ok({ _id: ff._id, ...fieldTypeAndInput })
      } else {
        // Unreachable branch
        return err(new ProcessingError())
      }
    }),
  ).map((responseData) => responseData.filter(isNonEmpty))

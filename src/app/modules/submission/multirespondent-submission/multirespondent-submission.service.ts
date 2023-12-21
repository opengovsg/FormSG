import { err, ok, Result } from 'neverthrow'

import { FormResponseMode } from '../../../../../shared/types'
import {
  IPopulatedForm,
  IPopulatedMultirespondentForm,
} from '../../../../types'
import { isFormMultirespondent } from '../../form/form.utils'
import { ResponseModeError } from '../submission.errors'

export const checkFormIsMultirespondent = (
  form: IPopulatedForm,
): Result<IPopulatedMultirespondentForm, ResponseModeError> => {
  return isFormMultirespondent(form)
    ? ok(form)
    : err(
        new ResponseModeError(
          FormResponseMode.Multirespondent,
          form.responseMode,
        ),
      )
}

import {
  AdminFormDto,
  BasicField,
  FormAuthType,
  FormResponseMode,
  MyInfoAttribute,
} from 'formsg-shared/types'
import {
  MYINFO_FIELDS_NEED_FORM_SINGPASS,
  MYINFO_FIELDS_NEED_SINGPASS_STEP,
} from 'formsg-shared/utils/step-login'

import { getDeleteLoginError } from './deleteLoginError'

const nameField = {
  _id: 'name',
  fieldType: BasicField.ShortText,
  title: 'Name',
  myInfo: { attr: MyInfoAttribute.Name },
}

const makeForm = (authType: FormAuthType) =>
  ({
    responseMode: FormResponseMode.Multirespondent,
    authType,
    form_fields: [nameField],
    workflow: [
      { _id: 's1', edit: [] },
      { _id: 's2', edit: ['name'], auth: { auth_type: FormAuthType.MyInfo } },
    ],
  }) as unknown as AdminFormDto

describe('getDeleteLoginError', () => {
  it('blocks deleting the workflow when Step 1 cannot fill the Myinfo fields', () => {
    expect(getDeleteLoginError(makeForm(FormAuthType.NIL))).toBe(
      MYINFO_FIELDS_NEED_FORM_SINGPASS,
    )
  })

  it('blocks deleting the only Singpass step', () => {
    expect(getDeleteLoginError(makeForm(FormAuthType.NIL), 1)).toBe(
      MYINFO_FIELDS_NEED_SINGPASS_STEP,
    )
  })

  it('allows deletes that leave a Singpass login', () => {
    const form = makeForm(FormAuthType.MyInfo)
    expect(getDeleteLoginError(form)).toBeUndefined()
    expect(getDeleteLoginError(form, 1)).toBeUndefined()
  })

  it('ignores forms that are not multi-respondent', () => {
    expect(
      getDeleteLoginError({
        ...makeForm(FormAuthType.NIL),
        responseMode: FormResponseMode.Encrypt,
      } as AdminFormDto),
    ).toBeUndefined()
  })
})

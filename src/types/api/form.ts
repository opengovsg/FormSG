import { IForm } from '../form'

import { EditFormFieldParams } from './field'

/**
 * @deprecated not used anymore, this is for the old
 * PUT /:formId/adminform endpoint.
 */
export type FormUpdateParams = {
  editFormField?: EditFormFieldParams
  authType?: IForm['authType']
  emails?: IForm['emails']
  esrvcId?: IForm['esrvcId']
  form_logics?: IForm['form_logics']
  hasCaptcha?: IForm['hasCaptcha']
  inactiveMessage?: IForm['inactiveMessage']
  permissionList?: IForm['permissionList']
  status?: IForm['status']
  title?: IForm['title']
  webhook?: IForm['webhook']
}

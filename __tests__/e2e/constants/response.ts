import { FormResponseMode } from 'shared/types'

interface FormResponseViewBase {
  mode: FormResponseMode
}

interface FormResponseViewEmail extends FormResponseViewBase {
  mode: FormResponseMode.Email
}

interface FormResponseViewEncrypt extends FormResponseViewBase {
  mode: FormResponseMode.Encrypt
  csv: boolean
}

export type FormResponseView = FormResponseViewEmail | FormResponseViewEncrypt

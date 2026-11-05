import { FormResponseMode } from 'formsg-shared/types'

interface FormResponseViewBase {
  mode: FormResponseMode
}

interface FormResponseViewEncrypt extends FormResponseViewBase {
  mode: FormResponseMode.Encrypt
  csv: boolean
}

export type FormResponseView = FormResponseViewEncrypt

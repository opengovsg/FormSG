import { enSG as create } from './create'
import { enSG as deleteLocale } from './delete'
import { enSG as rename } from './rename'

export const enSG = {
  create,
  rename,
  delete: deleteLocale,
}

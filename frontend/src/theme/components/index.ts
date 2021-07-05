import { YESNO_THEME_KEY, YesNoField } from './Field/YesNo'
import { Button } from './Button'
import { Form } from './Form'
import { FormError } from './FormError'
import { FormLabel } from './FormLabel'
import { Input } from './Input'

export const components = {
  Button,
  Input,
  Form,
  FormError,
  FormLabel,
  [YESNO_THEME_KEY]: YesNoField,
}

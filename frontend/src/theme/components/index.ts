import { YESNO_THEME_KEY, YesNoField } from './Field/YesNo'
import { Button } from './Button'
import { Form } from './Form'
import { FormError } from './FormError'
import { FormLabel } from './FormLabel'
import { Input } from './Input'
import { Link } from './Link'
import { NumberInput } from './NumberInput'
import { Textarea } from './Textarea'

export const components = {
  Button,
  Input,
  NumberInput,
  Textarea,
  Form,
  Link,
  FormError,
  FormLabel,
  [YESNO_THEME_KEY]: YesNoField,
}

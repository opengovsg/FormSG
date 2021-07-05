import { YESNO_THEME_KEY, YesNoField } from './Field/YesNo'
import { Button } from './Button'
import { Form } from './Form'
import { FormError } from './FormError'
import { Input } from './Input'
import { Link } from './Link'

export const components = {
  Button,
  Input,
  FormError,
  Form,
  Link,
  [YESNO_THEME_KEY]: YesNoField,
}

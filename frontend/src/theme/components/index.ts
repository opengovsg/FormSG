import { YESNO_THEME_KEY, YesNoField } from './Field/YesNo'
import { Button } from './Button'
import { Form } from './Form'
import { FormError } from './FormError'
import { Input } from './Input'

export const components = { 
  Button, 
  Input, 
  FormError, 
  Form,
  [YESNO_THEME_KEY]: YesNoField
}
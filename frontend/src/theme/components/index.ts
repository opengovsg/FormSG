import { RATING_THEME_KEY, RatingField } from './Field/Rating'
import { YESNO_THEME_KEY, YesNoField } from './Field/YesNo'
import { Banner } from './Banner'
import { Button } from './Button'
import { Checkbox } from './Checkbox'
import { Form } from './Form'
import { FormError } from './FormError'
import { FormLabel } from './FormLabel'
import { Input } from './Input'
import { Link } from './Link'
import { NumberInput } from './NumberInput'
import { PhoneNumberInput } from './PhoneNumberInput'
import { Radio } from './Radio'
import { Textarea } from './Textarea'

export const components = {
  Banner,
  Button,
  Checkbox,
  Form,
  FormError,
  FormLabel,
  Input,
  Link,
  NumberInput,
  PhoneNumberInput,
  Textarea,
  Radio,
  [RATING_THEME_KEY]: RatingField,
  [YESNO_THEME_KEY]: YesNoField,
}

import { RATING_THEME_KEY, RatingField } from './Field/Rating'
import { YESNO_THEME_KEY, YesNoField } from './Field/YesNo'
import { Banner } from './Banner'
import { Button } from './Button'
import { Form } from './Form'
import { FormError } from './FormError'
import { FormLabel } from './FormLabel'
import { Input } from './Input'
import { Link } from './Link'
import { NumberInput } from './NumberInput'
import { PhoneNumberInput } from './PhoneNumberInput'
import { Searchbar, SEARCHBAR_THEME_KEY } from './Searchbar'
import { Textarea } from './Textarea'

export const components = {
  Banner,
  Button,
  Form,
  FormError,
  FormLabel,
  Input,
  Link,
  NumberInput,
  PhoneNumberInput,
  Textarea,
  [SEARCHBAR_THEME_KEY]: Searchbar,
  [RATING_THEME_KEY]: RatingField,
  [YESNO_THEME_KEY]: YesNoField,
}

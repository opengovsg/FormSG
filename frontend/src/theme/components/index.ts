import { RATING_THEME_KEY, RatingField } from './Field/Rating'
import { YESNO_THEME_KEY, YesNoField } from './Field/YesNo'
import { Banner } from './Banner'
import { Button } from './Button'
import { Checkbox, CHECKBOX_THEME_KEY } from './Checkbox'
import { Form } from './Form'
import { FormError } from './FormError'
import { FormLabel } from './FormLabel'
import { InlineMessage } from './InlineMessage'
import { Input } from './Input'
import { Link } from './Link'
import { NumberInput } from './NumberInput'
import { Pagination, PAGINATION_THEME_KEY } from './Pagination'
import { PhoneNumberInput } from './PhoneNumberInput'
import { Radio, RADIO_THEME_KEY } from './Radio'
import { Textarea } from './Textarea'
import { Toast } from './Toast'

export const components = {
  Banner,
  Button,
  Form,
  FormError,
  FormLabel,
  Input,
  Link,
  InlineMessage,
  NumberInput,
  PhoneNumberInput,
  Textarea,
  [PAGINATION_THEME_KEY]: Pagination,
  [CHECKBOX_THEME_KEY]: Checkbox,
  [RADIO_THEME_KEY]: Radio,
  [RATING_THEME_KEY]: RatingField,
  [YESNO_THEME_KEY]: YesNoField,
  Toast,
}

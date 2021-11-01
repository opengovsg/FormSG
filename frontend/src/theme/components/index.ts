import { Attachment, ATTACHMENT_THEME_KEY } from './Field/Attachment'
import { RATING_THEME_KEY, RatingField } from './Field/Rating'
import { YESNO_THEME_KEY, YesNoField } from './Field/YesNo'
import { Badge } from './Badge'
import { Banner } from './Banner'
import { Button } from './Button'
import { Checkbox, CHECKBOX_THEME_KEY } from './Checkbox'
import { CloseButton } from './CloseButton'
import { Drawer } from './Drawer'
import { Form } from './Form'
import { FormError } from './FormError'
import { FormLabel } from './FormLabel'
import { InlineMessage } from './InlineMessage'
import { Input } from './Input'
import { Link } from './Link'
import { Menu } from './Menu'
import { Modal } from './Modal'
import { NumberInput } from './NumberInput'
import { Pagination, PAGINATION_THEME_KEY } from './Pagination'
import { PhoneNumberInput } from './PhoneNumberInput'
import { Radio, RADIO_THEME_KEY } from './Radio'
import { Searchbar, SEARCHBAR_THEME_KEY } from './Searchbar'
import { SingleCountryPhoneNumberInput } from './SingleCountryPhoneNumberInput'
import { Tabs } from './Tabs'
import { Textarea } from './Textarea'
import { Tile } from './Tile'
import { Toast } from './Toast'
import { Toggle, TOGGLE_THEME_KEY } from './Toggle'
import { Tooltip } from './Tooltip'

export const components = {
  Badge,
  Banner,
  Button,
  CloseButton,
  Drawer,
  Form,
  FormError,
  FormLabel,
  Input,
  Link,
  InlineMessage,
  Modal,
  Menu,
  NumberInput,
  PhoneNumberInput,
  SingleCountryPhoneNumberInput,
  Textarea,
  Tabs,
  [ATTACHMENT_THEME_KEY]: Attachment,
  [PAGINATION_THEME_KEY]: Pagination,
  [CHECKBOX_THEME_KEY]: Checkbox,
  [RADIO_THEME_KEY]: Radio,
  [SEARCHBAR_THEME_KEY]: Searchbar,
  Tooltip,
  [RATING_THEME_KEY]: RatingField,
  [YESNO_THEME_KEY]: YesNoField,
  [TOGGLE_THEME_KEY]: Toggle,
  Tile,
  Toast,
}

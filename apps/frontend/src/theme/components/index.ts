import { Attachment, ATTACHMENT_THEME_KEY } from './Field/Attachment'
import { RATING_THEME_KEY, RatingField } from './Field/Rating'
import { YESNO_THEME_KEY, YesNoField } from './Field/YesNo'
import { Accordion } from './Accordion'
import { Avatar } from './Avatar'
import { AvatarMenu } from './AvatarMenu'
import { Badge } from './Badge'
import { Banner } from './Banner'
import { Button } from './Button'
import { Calendar } from './Calendar'
import { Checkbox, CHECKBOX_THEME_KEY } from './Checkbox'
import { CloseButton } from './CloseButton'
import { DatePicker } from './DatePicker'
import { Divider } from './Divider'
import { Drawer } from './Drawer'
import { Form } from './Form'
import { FormError } from './FormError'
import { FormLabel } from './FormLabel'
import { InlineMessage } from './InlineMessage'
import { Input } from './Input'
import { Link } from './Link'
import { Menu } from './Menu'
import { Modal } from './Modal'
import { MultiSelect } from './MultiSelect'
import { NumberInput } from './NumberInput'
import { Pagination, PAGINATION_THEME_KEY } from './Pagination'
import { PhoneNumberInput } from './PhoneNumberInput'
import { Progress } from './Progress'
import { Radio, RADIO_THEME_KEY } from './Radio'
import { Searchbar, SEARCHBAR_THEME_KEY } from './Searchbar'
import { SingleCountryPhoneNumberInput } from './SingleCountryPhoneNumberInput'
import { SingleSelect } from './SingleSelect'
import { Table } from './Table'
import { Tabs } from './Tabs'
import { Tag } from './Tag'
import { TagInput } from './TagInput'
import { Textarea } from './Textarea'
import { Tile } from './Tile'
import { Toast } from './Toast'
import { Toggle, TOGGLE_THEME_KEY } from './Toggle'
import { Tooltip } from './Tooltip'

export const components = {
  Accordion,
  Avatar,
  AvatarMenu,
  Badge,
  Banner,
  Button,
  Calendar,
  CloseButton,
  DatePicker,
  Drawer,
  Form,
  FormError,
  FormLabel,
  Divider,
  Input,
  Link,
  InlineMessage,
  Modal,
  Menu,
  MultiSelect,
  NumberInput,
  PhoneNumberInput,
  Progress,
  SingleCountryPhoneNumberInput,
  SingleSelect,
  Textarea,
  Table,
  Tabs,
  Tag,
  TagInput,
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

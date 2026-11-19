import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiCaretDownSquare, BiEnvelope, BiMailSend } from 'react-icons/bi'
import { As } from '@chakra-ui/react'
import { useCombobox, UseComboboxStateChange } from 'downshift'
import { uniq } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { MultiSelectCombobox } from '~components/Dropdown/components/MultiSelectCombobox'
import { SelectPopoverProvider } from '~components/Dropdown/components/SelectPopover'
import { MultiSelectProvider } from '~components/Dropdown/MultiSelect/MultiSelectProvider'
import { ComboboxItem } from '~components/Dropdown/types'
import { splitEmails } from '~components/EmailListInput'

import {
  ACTION_VALUE_PREFIX,
  addFieldValue,
  EmailSourceFieldKind,
  EmailSources,
  emailSourcesToValues,
  emailValue,
  fieldValue,
  NEW_EMAIL_VALUE_PREFIX,
  panelValue,
  valuesToEmailSources,
} from './emailSource'
import { EmailSourceMenu } from './EmailSourceMenu'

export interface EmailSourceField {
  kind: EmailSourceFieldKind
  fieldId: string
  label: string
  icon?: As
}

export interface EmailSourceAction {
  label: string
  icon?: As
  onSelect: () => void
}

export interface EmailSourceInputProps {
  name: string
  value: EmailSources
  onChange: (value: EmailSources) => void
  onBlur?: () => void
  fields: EmailSourceField[]
  addFieldActions?: Partial<Record<EmailSourceFieldKind, EmailSourceAction>>
  placeholder?: string
  isDisabled?: boolean
  isInvalid?: boolean
}

type SourceItem = Exclude<ComboboxItem, string | null>

const PANEL_KINDS: EmailSourceFieldKind[] = ['emailField', 'dropdownField']

export const EmailSourceInput = ({
  name,
  value,
  onChange,
  onBlur,
  fields,
  addFieldActions = {},
  placeholder,
  isDisabled,
  isInvalid,
}: EmailSourceInputProps): JSX.Element => {
  const { t } = useTranslation()
  const values = useMemo(() => emailSourcesToValues(value), [value])
  const { emails } = value
  const [openPanel, setOpenPanel] = useState<EmailSourceFieldKind | null>(null)

  const fieldKinds = useMemo(
    () => new Map(fields.map(({ fieldId, kind }) => [fieldId, kind])),
    [fields],
  )

  const panels = useMemo(() => {
    const copy = {
      emailField: {
        label: t('components.emailSourceInput.emailField'),
        emptyLabel: t('components.emailSourceInput.noEmailFields'),
        icon: BiMailSend,
      },
      dropdownField: {
        label: t('components.emailSourceInput.dropdownField'),
        emptyLabel: t('components.emailSourceInput.noDropdownFields'),
        icon: BiCaretDownSquare,
      },
    }
    return PANEL_KINDS.map((kind) => {
      const addField = addFieldActions[kind]
      return {
        kind,
        ...copy[kind],
        rowItem: {
          value: panelValue(kind),
          label: copy[kind].label,
          isAction: true,
        },
        items: [
          ...fields
            .filter((field) => field.kind === kind)
            .map(({ fieldId, label, icon }) => ({
              value: fieldValue(fieldId),
              label,
              icon,
            })),
          ...(addField
            ? [
                {
                  value: addFieldValue(kind),
                  label: addField.label,
                  icon: addField.icon,
                  isAction: true,
                },
              ]
            : []),
        ],
      }
    })
  }, [addFieldActions, fields, t])

  const items = useMemo<SourceItem[]>(() => {
    const emailItems = emails.map((email) => ({
      value: emailValue(email),
      label: email,
      isInvalid: !isEmail(email),
    }))
    const missingFieldItems = [...value.emailFields, ...value.dropdownFields]
      .filter((fieldId) => !fieldKinds.has(fieldId))
      .map((fieldId) => ({
        value: fieldValue(fieldId),
        label: t('components.emailSourceInput.missingField'),
        isInvalid: true,
      }))
    return [
      ...emailItems,
      ...missingFieldItems,
      ...panels.flatMap(({ rowItem, items }) => [rowItem, ...items]),
    ]
  }, [emails, fieldKinds, panels, t, value])

  const filter = useCallback(
    (_items: SourceItem[], query: string) => {
      const rowItems = panels.map(({ rowItem }) => rowItem)
      const openPanelItems =
        panels.find(({ kind }) => kind === openPanel)?.items ?? []
      const menuItems = [...rowItems, ...openPanelItems]
      const text = query.trim()
      if (!text || splitEmails(text).every((email) => emails.includes(email))) {
        return menuItems
      }
      const addEmail = {
        value: `${NEW_EMAIL_VALUE_PREFIX}${text}`,
        label: t('components.emailSourceInput.pressEnterToAdd', {
          email: text,
        }),
        icon: BiEnvelope,
        isAction: true,
      }
      return [addEmail, ...menuItems]
    },
    [emails, openPanel, panels, t],
  )

  const handleChange = useCallback(
    (next: string[]) => {
      const added = next.filter((v) => !values.includes(v))
      const action = added.find((v) => v.startsWith(ACTION_VALUE_PREFIX))
      if (action) {
        const panelKind = PANEL_KINDS.find(
          (kind) => action === panelValue(kind),
        )
        if (panelKind) {
          setOpenPanel((open) => (open === panelKind ? null : panelKind))
          return
        }
        const addKind = PANEL_KINDS.find(
          (kind) => action === addFieldValue(kind),
        )
        if (addKind) addFieldActions[addKind]?.onSelect()
        return
      }
      onChange(valuesToEmailSources({ previous: value, next, fieldKinds }))
    },
    [addFieldActions, fieldKinds, onChange, value, values],
  )

  const queryRef = useRef('')
  const handleInputValueChange = useCallback(
    ({ inputValue = '', type }: UseComboboxStateChange<ComboboxItem>) => {
      const typed = queryRef.current
      queryRef.current = inputValue
      if (type !== useCombobox.stateChangeTypes.InputBlur) return
      if (!typed.trim()) return
      const next = uniq([...emails, ...splitEmails(typed)])
      if (next.length === emails.length) return
      onChange({ ...value, emails: next })
    },
    [emails, onChange, value],
  )

  return (
    <MultiSelectProvider
      name={name}
      items={items}
      values={values}
      onChange={handleChange}
      onBlur={onBlur ?? (() => undefined)}
      filter={filter}
      placeholder={placeholder ?? t('components.emailSourceInput.placeholder')}
      inputAria={{
        id: `${name}-aria`,
        label: t('components.emailSourceInput.ariaLabel'),
      }}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      maxItems={null}
      downshiftComboboxProps={{
        onInputValueChange: handleInputValueChange,
        onIsOpenChange: ({ isOpen }) => {
          if (!isOpen) setOpenPanel(null)
        },
      }}
    >
      <SelectPopoverProvider>
        <MultiSelectCombobox />
        <EmailSourceMenu panels={panels} openPanel={openPanel} />
      </SelectPopoverProvider>
    </MultiSelectProvider>
  )
}

import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'
import { useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import { BasicField } from 'formsg-shared/types'

import { ADMINFORM_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'
import { ComboboxItem } from '~components/Dropdown/types'

import {
  saveBeforeNavigation,
  useNavigationDraft,
} from '~features/admin-form/common/navigationSave'
import { adminFormKeys } from '~features/admin-form/common/queries'

/** Sentinel picker value for the "add a field" row. Never reaches form state. */
const ADD_FIELD_ITEM_VALUE = '__add_field__'

/** Search param the Build tab reads on arrival to stage a field creation. */
export const ADD_FIELD_SEARCH_PARAM = 'addField'

/** `?addField=` value used when no specific field type should be pre-staged. */
export const ADD_FIELD_ANY = 'any'

interface UseAddFieldPickerProps {
  /** Label for the action row, e.g. "Add an Email field". */
  label: string
  /** Field type to pre-stage in the Build tab. Omit to open the field list. */
  fieldType?: BasicField
  /** Set false to leave the picker untouched. Defaults to true. */
  enabled?: boolean
}

/**
 * Adds an "add a field" action to a field picker. The action is an ordinary
 * item, so it reuses the dropdown's own rendering, search and keyboard
 * handling, and it opens the Build tab in a new tab rather than navigating
 * away from a half-filled form. An editor that registers a navigation save
 * (the step login editor) is saved first, so the new tab sees its changes.
 */
export const useAddFieldPicker = ({
  label,
  fieldType,
  enabled = true,
}: UseAddFieldPickerProps) => {
  const { formId } = useParams()
  const queryClient = useQueryClient()

  // Fields created in the other tab land here on return. The global staleTime
  // blunts react-query's own focus refetch, so invalidate explicitly.
  useEffect(() => {
    if (!enabled || !formId) return
    const refetch = () =>
      void queryClient.invalidateQueries(adminFormKeys.id(formId))
    window.addEventListener('focus', refetch)
    return () => window.removeEventListener('focus', refetch)
  }, [enabled, formId, queryClient])

  const { t } = useTranslation()
  const toast = useToast({ status: 'danger', isClosable: true })

  const openBuilderInNewTab = useCallback(() => {
    if (!formId) return
    const url = new URL(`${ADMINFORM_ROUTE}/${formId}`, window.location.origin)
    url.searchParams.set(ADD_FIELD_SEARCH_PARAM, fieldType ?? ADD_FIELD_ANY)
    const draft = useNavigationDraft.getState().draft
    if (!draft?.dirty && !draft?.saving) {
      window.open(url.toString(), '_blank', 'noopener')
      return
    }
    // The new tab only sees the saved form, eg a step's new login, so save the
    // open step first. Open the tab now: browsers block one opened after a wait.
    const tab = window.open('', '_blank')
    void saveBeforeNavigation().then((saved) => {
      if (!saved) {
        tab?.close()
        toast({
          description: t(
            'features.adminForm.sidebar.workflow.addField.saveFailed',
          ),
        })
        return
      }
      if (!tab) {
        window.open(url.toString(), '_blank', 'noopener')
        return
      }
      tab.opener = null
      tab.location.href = url.toString()
    })
  }, [formId, fieldType, t, toast])

  /** Appends the action row to a picker's items. */
  const withAddFieldItem = useCallback(
    <Item extends ComboboxItem>(items: Item[]): (Item | ComboboxItem)[] =>
      enabled
        ? [
            ...items,
            {
              value: ADD_FIELD_ITEM_VALUE,
              label,
              icon: BiPlus,
              // An action, not a value: renders without a multiselect checkbox.
              isAction: true,
            },
          ]
        : items,
    [enabled, label],
  )

  /**
   * Wraps a picker's onChange so picking the action opens the Build tab
   * instead of committing the sentinel as a value.
   */
  const withAddFieldAction = useCallback(
    <Value extends string | string[]>(onChange: (value: Value) => void) =>
      (value: Value) => {
        if (!enabled) return onChange(value)
        const isAction = Array.isArray(value)
          ? value.includes(ADD_FIELD_ITEM_VALUE)
          : value === ADD_FIELD_ITEM_VALUE
        if (isAction) return openBuilderInNewTab()
        onChange(value)
      },
    [enabled, openBuilderInNewTab],
  )

  return { withAddFieldItem, withAddFieldAction }
}

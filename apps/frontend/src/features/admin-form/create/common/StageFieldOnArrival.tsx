import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import { BasicField } from 'formsg-shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useStageFieldAndNavigate } from '../workflow/hooks/useStageFieldAndNavigate'

import { ADD_FIELD_SEARCH_PARAM } from './useAddFieldPicker'

const BASIC_FIELDS = new Set<string>(Object.values(BasicField))

/**
 * Consumes `?addField=<BasicField|any>` when the Build tab is opened in a new
 * tab from a field picker, opening the Builder drawer on the staged field.
 */
export const StageFieldOnArrival = (): null => {
  const [searchParams, setSearchParams] = useSearchParams()
  const addField = searchParams.get(ADD_FIELD_SEARCH_PARAM)
  const stageFieldAndNavigate = useStageFieldAndNavigate()
  // Wait for the form so the field is appended, not inserted at index 0.
  const { data: form } = useAdminForm()
  const hasStaged = useRef(false)

  useEffect(() => {
    if (hasStaged.current || !addField || !form) return

    hasStaged.current = true
    stageFieldAndNavigate(
      BASIC_FIELDS.has(addField) ? (addField as BasicField) : undefined,
    )

    const next = new URLSearchParams(searchParams)
    next.delete(ADD_FIELD_SEARCH_PARAM)
    setSearchParams(next, { replace: true })
  }, [addField, form, stageFieldAndNavigate, searchParams, setSearchParams])

  return null
}

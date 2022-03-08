// Retrieved from https://github.com/react-hook-form/react-hook-form/issues/6393#issuecomment-988967276
// Fixes the problem with watched values in dependency array, where
// the watched value changes but the reference does not, leading to situations where
// hooks not re-running on dependency array changes
// (since technically the dependency did not appear to change).
// @note This hook only needs to be used for watching objects or arrays,
//       not for primitives (since those will always mutate).

import { useEffect, useState } from 'react'
import {
  FieldPath,
  FieldPathValue,
  FieldValues,
  UseFormWatch,
} from 'react-hook-form'
import { get } from 'lodash'

export interface WatchDependencyValue<T> {
  value: T
}

export function useWatchDependency<
  TFieldValues extends FieldValues,
  TFieldName extends FieldPath<TFieldValues>,
>(watch: UseFormWatch<TFieldValues>, fieldName: TFieldName) {
  const [state, setState] = useState<
    WatchDependencyValue<FieldPathValue<TFieldValues, TFieldName>>
  >(() => ({
    value: watch(fieldName),
  }))

  useEffect(() => {
    const subscription = watch((formData, { name }) => {
      if (name != null && (name === fieldName || name.startsWith(fieldName))) {
        setState({ value: get(formData, fieldName) })
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, fieldName])
  return state
}

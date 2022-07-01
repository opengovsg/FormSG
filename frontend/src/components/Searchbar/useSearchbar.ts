/**
 * Hook exposing convenient variables for use with `Searchbar` component.
 */

import { RefObject, useRef } from 'react'

type UseSearchbarReturn = {
  inputRef: RefObject<HTMLInputElement>
}

export const useSearchbar = (): UseSearchbarReturn => {
  const inputRef = useRef<HTMLInputElement>(null)

  return {
    inputRef,
  }
}

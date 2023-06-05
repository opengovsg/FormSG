import { useMediaMatch } from 'rooks'

export const useIsPrint = (): boolean => {
  const isPrint = useMediaMatch('print')
  return isPrint
}

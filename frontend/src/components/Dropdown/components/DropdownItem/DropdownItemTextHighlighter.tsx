import { useMemo } from 'react'
import Highlighter from 'react-highlight-words'
import { chakra, Text } from '@chakra-ui/react'
import escapeRegExp from 'lodash/escapeRegExp'

interface HighlightMarkProps {
  showHoverBg: boolean
  children: string
}

const HighlightMark = ({ showHoverBg, children }: HighlightMarkProps) => (
  <chakra.mark
    bg={showHoverBg ? 'primary.200' : 'primary.100'}
    transitionProperty="background"
    transitionDuration="ultra-fast"
    transitionTimingFunction="ease-in"
    color="primary.500"
  >
    {children}
  </chakra.mark>
)

interface DropdownItemTextHighlighterProps {
  /** Current input value in dropdown for highlighting of matched text */
  inputValue: string
  showHoverBg: boolean
  textToHighlight: string
}

export const DropdownItemTextHighlighter = ({
  inputValue,
  showHoverBg,
  textToHighlight,
}: DropdownItemTextHighlighterProps): JSX.Element => {
  /**
   * Allows for fuzzy matching of searched characters, resulting in better UX.
   * E.g. searching for `'rb'` will highlight `r` and `b` in `"radio button"`.
   */
  const regexSearchWords = useMemo(
    () => [new RegExp(`[${escapeRegExp(inputValue)}]`, 'gi')],
    [inputValue],
  )

  return (
    <Text textStyle="body-1">
      <Highlighter
        searchWords={regexSearchWords}
        highlightTag={({ children }) => (
          <HighlightMark children={children} showHoverBg={showHoverBg} />
        )}
        textToHighlight={textToHighlight}
      />
    </Text>
  )
}

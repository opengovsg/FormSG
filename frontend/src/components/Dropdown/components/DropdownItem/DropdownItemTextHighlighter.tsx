import { useMemo } from 'react'
import { chakra } from '@chakra-ui/react'
import fuzzysort from 'fuzzysort'

interface HighlightMarkProps {
  showHoverBg: boolean
  children: string
}

const HighlightMark = ({ showHoverBg, children }: HighlightMarkProps) => (
  <chakra.mark
    bg={showHoverBg ? 'primary.200' : 'primary.100'}
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
  const markedComponents = useMemo(() => {
    const result = fuzzysort.single(inputValue, textToHighlight)
    // Return the original text if no match is found.
    if (!result) return textToHighlight
    return fuzzysort.highlight(result, (m, i) => (
      <HighlightMark showHoverBg={showHoverBg} key={i}>
        {m}
      </HighlightMark>
    ))
  }, [inputValue, showHoverBg, textToHighlight])

  return <chakra.span>{markedComponents}</chakra.span>
}

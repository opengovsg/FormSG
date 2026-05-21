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
    if (!result) return [textToHighlight]
    return result.highlight((m, i) => (
      <HighlightMark showHoverBg={showHoverBg} key={`m-${i}`}>
        {m}
      </HighlightMark>
    ))
  }, [inputValue, showHoverBg, textToHighlight])

  // Wrap unmatched string fragments in <span> so every child of the outer
  // span is a stable element. Browser translation engines can wrap text
  // nodes in <font>, which breaks React reconciliation if it later tries to
  // remove or replace those text nodes directly.
  return (
    <chakra.span>
      {markedComponents.map((node, i) =>
        typeof node === 'string' ? <span key={`u-${i}`}>{node}</span> : node,
      )}
    </chakra.span>
  )
}

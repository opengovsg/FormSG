import { useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import breaks from 'remark-breaks'
import gfm from 'remark-gfm'

interface MarkdownTextProps {
  components?: Components
  /**
   * Whether to allow sequential new lines to generate sequential line breaks.
   * Breaks markdown specs, but allows for WYSIWYG text editing.
   * @defaultValues `false`
   */
  multilineBreaks?: boolean
  children: string
}

export const MarkdownText = ({
  components,
  children,
  multilineBreaks = false,
}: MarkdownTextProps): JSX.Element => {
  const processedRawString = useMemo(() => {
    // Create new line nodes for every new line in raw string so new lines gets rendered.
    if (multilineBreaks) {
      return (
        /**
         * For lines that are contain a token that indents,
         * we want to remove the whitespace before the newline
         * so that new lines that come after these tokens
         * can break out of the indentation group
         *
         *  (-|\d+\.|\*): matching character tokens that indents
         *     -: "-"
         *     *: "*",
         *     \d+ : "1.", "2.", etc.
         *
         *   \s: whitespace following the token, indentation groups must start with token followed by a whitespace character
         *
         *   .*: any character, any number of times, this is the actual text content of the line
         *
         *   \n: new line character
         */
        children
          .replace(/\n/g, '&nbsp; \n')
          .replace(/(\n(-|\d+\.|\*)\s.*\n)(&nbsp; \n)/g, '$1 \n')
      )
    }
    return children
  }, [children, multilineBreaks])

  return (
    <ReactMarkdown
      // Prevent <br> tags from being created, remark-breaks will still create newlines which gets replaced.
      disallowedElements={['br']}
      components={components}
      remarkPlugins={[gfm, breaks]}
    >
      {processedRawString}
    </ReactMarkdown>
  )
}

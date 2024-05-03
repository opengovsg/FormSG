import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import breaks from 'remark-breaks'
import gfm from 'remark-gfm'

import {
  useMdComponents,
  type UseMdComponentsProps,
} from '~hooks/useMdComponents'

interface MarkdownTextProps {
  componentProps?: UseMdComponentsProps
  /**
   * Whether to allow sequential new lines to generate sequential line breaks.
   * Breaks markdown specs, but allows for WYSIWYG text editing.
   * @defaultValues `false`
   */
  multilineBreaks?: boolean
  children: string
}

export const MarkdownText = ({
  componentProps,
  children,
  multilineBreaks = false,
}: MarkdownTextProps): JSX.Element => {
  const components = useMdComponents(componentProps)

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

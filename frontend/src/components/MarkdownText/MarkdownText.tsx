import { useMemo } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import type { PluggableList } from 'react-markdown/lib/react-markdown'
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
      /**
       * Matching new lines that are not preceded by a token that indents.
       *
       * (?<!{regex}): negative lookbehind to ensure that the following regex does not match
       *
       *   (-|\d+\.|\*): matching character tokens that indents
       *     -: "-"
       *     *: "*",
       *     \d+ : "1.", "2.", etc.
       *
       *   \s: whitespace following the token, indentation groups must start with token followed by a whitespace character
       *
       *   .*: any character, any number of times, this is the actual text content of the line
       *
       *   \n: new line character
       *
       * \n: the new line character that we will want markdown to render as a new line
       */
      return children.replace(/(?<!(-|\d+\.|\*)\s.*\n)\n/gi, '&nbsp; \n')
    }
    return children
  }, [children, multilineBreaks])

  return (
    <ReactMarkdown
      // Prevent <br> tags from being created, remark-breaks will still create newlines which gets replaced.
      disallowedElements={['br']}
      components={components}
      // Known issue, only types are breaking. See https://github.com/orgs/rehypejs/discussions/63.
      remarkPlugins={[gfm, breaks] as PluggableList}
    >
      {processedRawString}
    </ReactMarkdown>
  )
}

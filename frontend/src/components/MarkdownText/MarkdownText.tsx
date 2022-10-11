import { useMemo } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import type { PluggableList } from 'react-markdown/lib/react-markdown'
import breaks from 'remark-breaks'
import gfm from 'remark-gfm'

interface MarkdownTextProps {
  components?: Components
  children: string
}

export const MarkdownText = ({
  components,
  children,
}: MarkdownTextProps): JSX.Element => {
  // Create new line nodes for every new line in raw string so new lines gets rendered.
  const newLinedStrings = useMemo(
    () => children.replace(/\n/gi, '&nbsp; \n'),
    [children],
  )

  return (
    <ReactMarkdown
      // Prevent <br> tags from being created, remark-breaks will still create newlines which gets replaced.
      disallowedElements={['br']}
      components={components}
      // Known issue, only types are breaking. See https://github.com/orgs/rehypejs/discussions/63.
      remarkPlugins={[gfm, breaks] as PluggableList}
    >
      {newLinedStrings}
    </ReactMarkdown>
  )
}

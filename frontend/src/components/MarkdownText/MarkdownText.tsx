import ReactMarkdown, { Components } from 'react-markdown'
import { findAndReplace } from 'mdast-util-find-and-replace'
import gfm from 'remark-gfm'

const breaks = () => {
  const replace = (match: string) => {
    return {
      type: 'text',
      data: {
        hName: 'br',
      },
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transform = (markdownAST: any) => {
    //@ts-expect-error magic
    findAndReplace(markdownAST, /\n/g, replace)
    return markdownAST
  }

  return transform
}

interface MarkdownTextProps {
  components?: Components
  children: string
}

export const MarkdownText = ({
  components,
  children,
}: MarkdownTextProps): JSX.Element => {
  return (
    <ReactMarkdown components={components} remarkPlugins={[gfm, breaks]}>
      {children}
    </ReactMarkdown>
  )
}

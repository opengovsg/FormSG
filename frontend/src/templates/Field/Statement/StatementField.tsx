import ReactMarkdown from 'react-markdown'

import { FormFieldWithId, StatementFieldBase } from '~shared/types/field'

import { useMdComponents } from '~hooks/useMdComponents'

export type StatementFieldSchema = FormFieldWithId<StatementFieldBase>
export interface StatementFieldProps {
  schema: StatementFieldSchema
}

export const StatementField = ({
  schema,
}: StatementFieldProps): JSX.Element => {
  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'body-1',
        color: 'secondary.700',
      },
    },
  })
  return (
    <ReactMarkdown components={mdComponents}>
      {schema.description}
    </ReactMarkdown>
  )
}

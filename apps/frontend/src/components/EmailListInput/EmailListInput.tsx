import { forwardRef } from '@chakra-ui/react'
import { uniq } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { TagInput, TagInputProps } from '~components/TagInput'

import { splitEmails } from './splitEmails'

export type EmailListInputProps = Omit<TagInputProps, 'tagValidation'>

export const EmailListInput = forwardRef<EmailListInputProps, 'input'>(
  ({ onChange, ...props }, ref): JSX.Element => {
    return (
      <TagInput
        ref={ref}
        tagValidation={isEmail}
        onChange={(tags) => onChange?.(uniq(tags.flatMap(splitEmails)))}
        {...props}
      />
    )
  },
)

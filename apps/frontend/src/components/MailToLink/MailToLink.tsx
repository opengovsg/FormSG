import { useMemo } from 'react'

import Link, { LinkProps } from '~components/Link'

interface MailToLinkProps extends LinkProps {
  email?: string
  subject?: string
  body?: string
}
export const MailToLink = ({
  email = '',
  subject = '',
  body = '',
  children,
}: MailToLinkProps): JSX.Element => {
  const href = useMemo(() => {
    let params = subject || body ? '?' : ''
    if (subject) params += `subject=${encodeURIComponent(subject)}`
    if (body) params += `${subject ? '&' : ''}body=${encodeURIComponent(body)}`
    return `mailto:${email}${params}`
  }, [body, email, subject])

  return (
    <Link target="_blank" href={href}>
      {children}
    </Link>
  )
}

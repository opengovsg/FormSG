import { Link } from 'react-router-dom'

import { LOGIN_ROUTE } from '~constants/routes'
import { PublicHeader } from '~templates/Header'

const PUBLIC_HEADER_LINKS = [
  {
    label: 'Help',
    href: 'https://guide.form.gov.sg',
    showOnMobile: true,
  },
]

export const AppPublicHeader = (): JSX.Element => {
  return (
    <PublicHeader
      publicHeaderLinks={PUBLIC_HEADER_LINKS}
      loginButtonProps={{
        as: Link,
        to: LOGIN_ROUTE,
      }}
    />
  )
}

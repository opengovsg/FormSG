import { Helmet } from 'react-helmet-async'

import { env } from '~/env'

export const AppHelmet = (): JSX.Element => {
  const GATrackingID = env.gaTrackingId
  return (
    <Helmet titleTemplate="%s | FormSG" defer={false}>
      {GATrackingID ? (
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GATrackingID}`}
        />
      ) : null}
    </Helmet>
  )
}

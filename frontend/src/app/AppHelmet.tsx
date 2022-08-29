import { Helmet } from 'react-helmet-async'

import { useEnv } from '~features/env/queries'

export const AppHelmet = (): JSX.Element => {
  const { data: { GATrackingID } = {} } = useEnv()

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

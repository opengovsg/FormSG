import { Helmet } from 'react-helmet'
import { Partytown } from '@builder.io/partytown/react'

import { useEnv } from '~features/env/queries'

export const AppHelmet = (): JSX.Element => {
  const { data: { GATrackingID } = {} } = useEnv()

  return (
    <>
      <Partytown forward={['dataLayer.push']} />
      <Helmet titleTemplate="%s | FormSG" defer={false}>
        {GATrackingID ? (
          <script
            type="text/partytown"
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GATrackingID}`}
          />
        ) : null}
        {GATrackingID ? (
          <script type="text/partytown">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
            
              gtag('config', '${GATrackingID}');
            `}
          </script>
        ) : null}
      </Helmet>
    </>
  )
}

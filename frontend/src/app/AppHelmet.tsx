import { Helmet } from 'react-helmet-async'
import { partytownSnippet } from '@builder.io/partytown/integration'

import { useEnv } from '~features/env/queries'

export const AppHelmet = (): JSX.Element => {
  const { data: { GATrackingID } = {} } = useEnv()

  return (
    <Helmet titleTemplate="%s | FormSG" defer={false}>
      {/* Setting vanilla partytown script here since react-helmet handles head modification */}
      <script>
        {`
          partytown = {
            forward: ['dataLayer.push', 'gtag'],
          }
        `}
      </script>
      <script>{partytownSnippet()}</script>
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
              gtag('config', '${GATrackingID}', { 'debug_mode':true });
              window.gtag = gtag;
            `}
        </script>
      ) : null}
    </Helmet>
  )
}

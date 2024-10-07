import { Helmet } from 'react-helmet-async'

export const AppHelmet = (): JSX.Element => {
  const GATrackingID = import.meta.env.VITE_APP_GA_TRACKING_ID
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

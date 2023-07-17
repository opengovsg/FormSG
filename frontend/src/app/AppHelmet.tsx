import { Helmet } from 'react-helmet-async'

export const AppHelmet = (): JSX.Element => {
  // const GATrackingID = process.env.REACT_APP_GA_TRACKING_ID
  const GATrackingID = 'UA-130216930-3'
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

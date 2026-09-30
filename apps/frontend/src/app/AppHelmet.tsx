import { Helmet } from 'react-helmet-async'

import { env } from '~/env'

import { isWorkflowPrototype } from '~features/admin-form/responses/prototype/config'

export const AppHelmet = (): JSX.Element => {
  const GATrackingID = env.gaTrackingId
  return (
    <Helmet titleTemplate="%s | FormSG" defer={false}>
      {isWorkflowPrototype ? <title>Workflow actions prototype</title> : null}
      {GATrackingID && !isWorkflowPrototype ? (
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GATrackingID}`}
        />
      ) : null}
    </Helmet>
  )
}

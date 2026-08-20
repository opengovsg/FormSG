import { LandingV5 } from '.'

export const enSG: LandingV5 = {
  proof: {
    title: 'Trusted across government, healthcare and schools.',
    // Funnel order: agencies -> forms -> responses.
    agencies: 'agencies on FormSG',
    // `formCount` counts every form document regardless of status, so this
    // reuses the product's existing word for that number rather than the
    // prototype's "forms published", which the data does not support.
    forms: 'forms launched',
    responses: 'responses collected',
  },
}

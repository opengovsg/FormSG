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
  security: {
    title: 'Safe is the default, not a setting',
    body: "Each person's responses are encrypted. Only assigned officers with a secret key can see the responses. No one else does, including the FormSG team.",
    clearance: 'Cleared for government data',
    // Split label/value because the value is emphasised in place. The
    // prototype's third claim, on IM8 compliance, was cut: it was the one line
    // that needed prior knowledge to parse, and the two clearance levels carry
    // the point without it.
    classificationLabel: 'Security Classification: up to',
    classificationValue: 'Confidential (Cloud-Eligible)',
    sensitivityLabel: 'Information Sensitivity: up to',
    sensitivityValue: 'Sensitive (High)',
    caption: 'Responses are fully encrypted.',
  },
}

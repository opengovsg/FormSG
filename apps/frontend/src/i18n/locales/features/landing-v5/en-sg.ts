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
  capabilities: {
    title: 'From first question to final approval',
    lede: 'A form on FormSG runs the whole process, not just the collection.',
    build: {
      title: 'Build with a drag-and-drop builder',
      body: 'Pick different form fields and drag them onto the form. The first cut of your form can be out by lunch.',
    },
    // Deliberately NOT the prototype's copy. It read "Set up the workflow and
    // let it run automatically" / "Reminders to finish their turn are just one
    // click away", which contradicts itself — if it runs automatically, why is
    // anyone clicking? — and contradicts `docs/DECISIONS.md`, which locks
    // "told when it's their turn" and "a nudge is one click" precisely because
    // FormSG does not auto-send approval reminders. Routing is automatic;
    // chasing is not. This wording keeps both locked phrases verbatim.
    workflow: {
      title: 'Set up the workflow and let it run',
      body: "Responses get routed to the right people to fill up the form or approve them. Each person is told when it's their turn, and a nudge is one click away.",
    },
  },
  examples: {
    title: 'Start from a working example',
    lede: 'Three templates teams run every day. Open one and make it yours.',
    viewTemplate: 'View template',
    claims: {
      name: 'Staff claims',
      body: "Staff submit a claim, an officer approves it, finance is told. The confirmation lands in everyone's inbox on its own.",
    },
    singpass: {
      name: 'Applications with Singpass',
      body: 'Applicants verify with Singpass, your team processes each case, and the outcome email goes out from the workflow.',
    },
    event: {
      name: 'Event registration',
      body: 'Sign-ups collect themselves, and every registrant gets an instant email confirmation with the details.',
    },
  },
  testimonial: {
    eyebrow: 'What teams say',
    quote:
      "FormSG has been a practical tool in our school's digitisation journey, helping us simplify data collection and improve selected workflows where an e-form is the right fit.",
    name: 'Muhammad Hasif Mohd Hanifah',
    role: 'Cluster ICT Manager, River Valley Primary School',
  },
}

import { LandingPage } from '.'

export const enSG: LandingPage = {
  hero: {
    title: 'Build secure government forms in minutes.',
    subtitle:
      'Instant, customisable forms with zero code or cost, to safely collect classified and sensitive data.',
    ctaButtonLabel: 'Start building your form now',
  },
  featureSection: {
    title: 'Our form building and data collection features',
    features: {
      dragDropBuilder: {
        title: 'Drag and drop builder',
        description:
          'Launch forms in minutes with the drag-and-drop builder, and over 20 types of fields to choose from',
      },
      singpassAndMyinfo: {
        title: 'Singpass and Myinfo',
        description:
          'Authenticate individuals or businesses with Singpass, and speed up form filling with pre-filled data from Myinfo',
      },
      conditionalLogic: {
        title: 'Conditional logic',
        description:
          'Create dynamic forms that show or hide specific fields based on previous responses',
      },
      emailConfirmation: {
        title: 'Email confirmation',
        description:
          'Send confirmation emails to your respondents along with a copy of their responses',
      },
      workflow: {
        title: 'Workflow',
        description:
          'Route forms through multiple respondents for approvals and sequential submissions, all within a single form',
      },
      webhooks: {
        title: 'Webhooks',
        description:
          'Send form responses to external applications in real time',
      },
    },
  },
  getStartedSection: {
    title: 'No onboarding, no fees, no code.',
    subtitle:
      'Sign in with your government email address, and start building forms immediately. It’s free, and requires no onboarding or approvals.',
    ctaButtonLabel: 'Get started',
  },
  usedByAgenciesSection: {
    title: 'Used by most government agencies',
    formsLaunched: 'forms launched',
    submissionsReceived: 'submissions received',
    publicOfficersOnboard: 'public officers onboard',
    governmentAgencies: 'government agencies',
    exampleUserTitle: 'Examples of users of FormSG',
  },
  useCaseSection: {
    title: 'Supporting national and emergent use cases',
    subtitle:
      'Form is a critical enabler of many agency workflows. Notable forms launched include:',
  },
  storageModeSection: {
    title: 'Secure collection of responses',
    subtitle:
      'All form responses are encrypted and can be sent directly to your email inbox or exported as a spreadsheet. This means third parties, including FormSG, will not be able to access or view your form data and emails.',
    modes: {
      security: {
        title: 'Security Classification',
        description: 'Up to Confidential (Cloud-Eligible)',
      },
      sensitivity: {
        title: 'Info Sensitivity',
        description: 'Up to Sensitive (High)',
      },
    },
    guideCtaLabel: 'Read more',
  },
  opensourceSection: {
    title: 'Open sourced',
    subtitle:
      'Our code is open source, meaning anyone can help improve it and build on it, including governments of other countries.',
    forkItCtaLabel: 'Fork it on Github',
  },
  helpCenterSection: {
    title: 'Help Center',
    subtitle:
      'Have a question? Most answers can be found in our self-service Help Center. Common questions include:',
    visitHelpCenterCtaLabel: 'Visit our Help Center',
    common: {
      sourceLinkLabel: 'Read more',
    },
    qnaAccordionItem: {
      whoCanCreate: {
        question: 'Who can create forms?',
        answer:
          'Only government agencies and organisations approved by Ministries can create forms on FormSG.',
      },
      highVolume: {
        question: 'Can FormSG handle high volume?',
        answer: `Yes. Some forms already exceed 1 million responses, and there is no hard cap on the number of responses you can collect.

            As a best practice, filter responses by date before exporting, and give our support team a heads-up if you expect to collect a very large number of responses.`,
      },
      isFree: {
        question: 'Is FormSG free?',
        answer:
          'Yes, FormSG is completely free. Admins can get started and self-help without involving our team.',
      },
      howDoesE2eWork: {
        question: 'How does end-to-end encryption work?',
        answer: `
          When a respondent submits a response, response data is encrypted in the respondent's browser before being sent to our servers for storage. This means that by the time Form's servers receive responses, they have already been scrambled and are stored in this unreadable form. Your response data remains in this encrypted state until you decrypt your responses with your secret key, transforming them into a readable format.

          The benefit of end-to-end encryption is that response data enters and remains in Form's servers in an encrypted state. This ensures that even if our servers are compromised by an attack, attackers will still not be able to decrypt and view your response data, as they do not possess your secret key.
        `,
      },
    },
  },
  howItWorksSection: {
    title: 'How it works',
    modes: {
      storage: {
        tab: 'Storage mode',
        description:
          'Collect responses from individual respondents. Ideal for one-way submissions. All data is encrypted, which means third parties, including FormSG, will not be able to access or view your form data.',
        steps: {
          one: 'Log in to FormSG via Internet or Intranet',
          two: 'Create a new Storage mode form and store Secret Key safely',
          three: 'Build form fields',
          four: 'Share form link with respondents',
          five: 'Upload Secret Key and view your responses',
          six: 'Download your responses as a CSV and collect responses at your email address',
        },
      },
      mrf: {
        tab: 'Multi-respondent mode',
        description:
          'Collect responses from multiple respondents in a single workflow. Ideal for sequential submissions. All data is encrypted, which means third parties, including FormSG, will not be able to access or view your form data.',
        steps: {
          one: 'Log in to FormSG via Internet or Intranet',
          two: 'Create a new multi-respondent form and store the Secret Key safely',
          three:
            'Build form fields and assign them to various steps in your workflow',
          four: `Share form link for automatic routing to next respondent(s)`,
          five: 'Upload Secret Key and view your responses',
          six: 'Download your responses as a CSV and collect responses at your email address',
        },
      },
    },
  },
  ogpProductSuiteSection: {
    title: 'All the government tools you need to manage your workflow',
    subtitle:
      'FormSG is part of the **Open Government Products Suite**, and as a public officer you can mix and match from our set of productivity and collaboration tools.',
    ctaLinkLabel: 'Full list of OGP products',
  },
  ctaSection: {
    title: 'Start building your form now.',
    ctaButtonLabel: 'Get started',
  },
}

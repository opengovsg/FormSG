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
      prefill: {
        title: 'Prefill',
        description:
          'Make form filling faster for respondents by pre-filling fields for them',
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
      'All form responses are either encrypted end-to-end (Storage mode) or sent directly to your email inbox (Email mode). This means third parties, including FormSG, will not be able to access or view your form data.',
    modes: {
      storage: {
        title: 'Storage mode',
        sensitivityLevel: 'Sensitive (Normal)',
      },
      email: {
        title: 'Email mode',
        sensitivityLevel: 'Sensitive (High)',
      },
    },
    guideCtaLabel: 'Read more about Storage Mode',
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
      sourceLinkLabel: 'Source',
    },
    qnaAccordionItem: {
      loseSecretKey: {
        question: 'What happens if I lose my Secret Key?',
        answer: `
          If you have lost your secret key, take these steps immediately:

          1. If your form is live, duplicate your form, save the new secret key securely and replace the original form's link with the new form's link to continue collecting responses. Deactivate the original form as soon as possible to avoid losing further responses.

          2. On the computer you used to create the original form, search for 'Form Secret Key'. Secret keys typically downloaded into your Downloads folder as .txt files with 'Form Secret Key' in the filename.

          3. If you have created multiple forms with similar titles in the past, it is possible that you have confused the different forms' secret keys with each other, as form titles are in the secret keys' filenames. Try all secret keys with similar filenames on your form.

          4. If you remember sending an email to share your secret key with collaborators, search the Sent folder in your email for the keyword 'secret key' and your form title.

          5. If you still cannot find your secret key and would like our help to debug this further, contact us on our [help form]({CONTACT_US}).

          Without your secret key, you will not be able to access your existing response data. Additionally, it's not possible for us to recover your lost secret key or response data on your behalf. This is because Form does not retain your secret key or any other way to unlock your encrypted data - the only way to ensure response data is truly private to agencies only. This is an important security benefit, because that means even if our server were to be compromised, an attacker would never be able to unlock your encrypted responses.
        `,
      },
      increaseAttachmentSizeLimit: {
        question: 'How do I increase attachment size limit?',
        answer: `
          The current size limit is 7 MB for email mode forms, and 20 MB for storage mode forms.

          7 MB for email mode forms is a hard limit because the email service we use has a fixed 10 MB outgoing size, and we buffer 3 MB for email fields and metadata.

          Because the smallest unit you can attach per attachment field is 1 MB, you can have a max of 7 attachments on your form in email mode, and a max of 20 attachments in storage mode. If your user has to submit more than 7  documents in email mode (or more than 20 in storage mode), you may create just one attachment field of 7 or 20 MB in their respective modes, and advise your user to zip documents up and submit as one attachment.
        `,
      },
      howDoesE2eWork: {
        question: 'How does end-to-end encryption work?',
        answer: `
          When a respondent submits a response, response data is encrypted in the respondent's browser before being sent to our servers for storage. This means that by the time Form's servers receive responses, they have already been scrambled and are stored in this unreadable form. Your response data remains in this encrypted state until you decrypt your responses with your secret key, transforming them into a readable format.

          The benefit of end-to-end encryption is that response data enters and remains in Form's servers in an encrypted state. This ensures that even if our servers are compromised by an attack, attackers will still not be able to decrypt and view your response data, as they do not possess your secret key.
        `,
      },
      howToTransferOwnership: {
        question: 'How do I transfer ownership of my forms?',
        answer: `
          You can transfer ownership on the top right hand corner of each form by clicking the Add Collaborator button.

          Note that you might not need to transfer ownership of your form. You may simply add your colleague as a collaborator. Collaborators have the same rights as form creators, except they cannot delete the form.
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
          'View your responses within FormSG. All data is end-to-end encrypted, which means third parties, including FormSG, will not be able to access or view your form data.',
        steps: {
          one: 'Log in to FormSG via Internet or Intranet',
          two: 'Create a new Storage mode form and store Secret Key safely',
          three: 'Build and share form link with respondents',
          four: 'Upload Secret Key and view your responses',
          five: 'Download your responses as a CSV and collect responses at your email address',
        },
      },
      email: {
        tab: 'Email mode',
        description:
          'Receive your responses at your email address. Form sends responses directly to your email and does not store any response data.',
        steps: {
          one: 'Log in to FormSG via Internet or Intranet',
          two: 'Create a new form and choose Email mode',
          three: 'Build and publish your form',
          four: 'Collect responses at your email address',
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

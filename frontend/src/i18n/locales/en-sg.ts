import Translation from './types'

export const enSG: Translation = {
  translation: {
    features: {
      login: {
        LoginPage: {
          slogan: 'Build secure government forms in minutes',
        },
        components: {
          LoginForm: {
            onlyAvailableForPublicOfficers:
              'Log in with a .gov.sg or other whitelisted email address',
            email: 'Email',
            emailEmptyErrorMsg: 'Please enter an email address',
            login: 'Log in',
            haveAQuestion: 'Have a question?',
          },
        },
      },
    },
    pages: {
      Landing: {
        LandingPage: {
          hero: {
            slogan: 'Build secure government forms in minutes.',
            subtitle:
              'A free, easy to use, no-code form builder with advanced features for public officers to securely collect classified and sensitive data.',
            buttonText: 'Start building your form now',
          },
          features: {
            title: 'Our form building and data collection features',
            dragAndDropBuilder: {
              title: 'Drag and drop builder',
              text: 'Create and publish forms in minutes using our user-friendly drag and drop builder, with more than over 65 field types, including attachments, dates, tables, ratings, and many more.',
            },
            accessible: {
              title: 'Accessible',
              text: 'All our forms are fully responsive and aim to meet Web Content Accessibility Guidelines (WCAG 2.1), which makes web content more accessible to people with disabilities.',
            },
            conditionalLogic: {
              title: 'Conditional logic',
              text: 'Create advanced logic for your forms, and show or hide fields and/or sections based on your user’s input, personalising their experience.',
            },
            governmentIntegrations: {
              title: 'Government integrations',
              text: 'Authenticate your users with Singpass or Corppass. MyInfo fields can also be pre-filled once citizens log in through Singpass.',
            },
            webhooks: {
              title: 'Webhooks',
              text: 'Get every form submission sent straight to a compatible web app or URL as soon as it’s submitted with Webhooks.',
            },
            formSections: {
              title: 'Form sections',
              text: 'Manage long forms by sectioning it so your users enjoy a more seamless experience.',
            },
            prefill: {
              title: 'Prefill',
              text: 'Speed up the form filling process for your users by prefilling fields for them.',
            },
            emailConfirmation: {
              title: 'Email confirmation',
              text: 'Send confirmation emails to your respondents along with a copy of their response.',
            },
          },
        },
      },
    },
  },
}

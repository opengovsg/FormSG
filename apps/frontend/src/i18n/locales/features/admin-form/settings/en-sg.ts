import { enSG as emailNotifications } from './email-notifications'
import { enSG as general } from './general'
import { enSG as multiLanguage } from './multi-language'
import { enSG as payments } from './payments'
import { enSG as webhooks } from './webhooks'

export const enSG = {
  general,
  singpass: {
    title: 'Singpass',
    submitterIdCollection: {
      toggleLabel: 'Collect NRIC/FIN/UENs with form submissions',
      convert: 'Convert',
      closeFormToConvert: 'Close your form to convert.',
      loginFieldsLockAuth:
        'To change your Singpass authentication mode, remove the existing login-filled fields.',
      removeIdentityFieldsFirst:
        'Your form already collects NRIC/FIN/UENs through form fields. To use this setting instead, remove those fields first.',
      stopHint:
        'You cannot disable this anymore. Convert to fields and delete them instead.',
      autoConvertNotice:
        'This will automatically be converted for you by end Jun 2027. <guideLink>Learn more</guideLink>.',
      otherFormsAutoConvertNotice:
        'This will automatically be converted for other forms by end Jun 2027.',
      preview: {
        title: 'Conversion preview',
        before: 'Before',
        after: 'After',
        settingsTitle: 'Singpass settings',
      },
      // Singpass converts to one field and Corppass to two, so each login has
      // its own sentences.
      singpass: {
        movedToFields:
          'NRIC/FIN/UEN collection is now a form field. <builderLink>Add it from the Singpass tab</builderLink>.',
        modalTitle: 'Convert to NRIC/FIN field?',
        modalBody:
          'Add this field to the end of your form. It will be prefilled after the respondent logs in with Singpass.',
        warning:
          '<bold>If you use webhooks, email JSON or CSV exports</bold>, check them after converting. In new responses, "SingPass Validated NRIC" becomes "NRIC/FIN". Past responses, response limits and eligibility stay the same.',
      },
      corppass: {
        movedToFields:
          'NRIC/FIN/UEN collection is now a form field. <builderLink>Add it from the Corppass tab</builderLink>.',
        modalTitle: 'Convert to NRIC/FIN and UEN fields?',
        modalBody:
          'Add these fields to the end of your form. These will be prefilled after the respondent logs in with Corppass.',
        warning:
          '<bold>If you use webhooks, email JSON or CSV exports</bold>, check them after converting. In new responses, "CorpPass Validated UID" becomes "NRIC/FIN" and "CorpPass Validated UEN" becomes "UEN". Past responses, response limits and eligibility stay the same.',
      },
    },
  },
  tabs: {
    newBadge: 'New',
    multiLanguage: 'Multi-language',
  },
  secretKeyModal: {
    fieldLabel: 'Enter or upload Secret Key',
    uploadFromFileAriaLabel: 'Pass secret key from file',
    validation: {
      required: "Please enter the form's secret key",
      invalidSecretKey: 'The secret key provided is invalid',
    },
    placeholder: {
      dragging: 'Drop your Secret Key here',
      default: 'Enter or drop your Secret Key to continue',
    },
    ackLabel:
      'If I lose my key, I will not be able to activate my form and all my responses will be lost permanently',
    activation: {
      modalTitle: 'Activate your form',
      submitButton: 'Activate form',
    },
    whitelistCsv: {
      modalTitle: 'Download CSV file of whitelisted NRIC/FIN/UEN(s)',
      submitButton: 'Download file',
    },
  },
  secretKeyVerification: {
    errors: {
      invalidFile: 'Selected file seems to be invalid',
      invalidKey: 'The secret key provided is invalid',
    },
  },
  mutations: {
    missingFormId: 'No form ID was provided.',
    formStatus: {
      openStorageMode:
        'Your form is now open.\n\nStore your secret key in a safe place. If you lose your secret key, all your responses will be lost permanently.',
      open: 'Your form is now open.',
      closed: 'Your form is closed to new responses.',
    },
    multiLang: {
      enabled:
        'Multi-language enabled. Respondents can now select other languages to view your form in.',
      disabled: 'Multi-language disabled.',
    },
    supportedLanguages: {
      selectable:
        'Respondents will now be able to select and view your form in {language}.',
      hidden:
        '{language} is now hidden. Respondents will not be able to see it.',
    },
    saveDraft: {
      enabled: 'Saving of draft responses is now enabled on your form.',
      disabled: 'Saving of draft responses is now disabled on your form.',
    },
    captcha: {
      enabled: 'reCAPTCHA is now enabled on your form.',
      disabled: 'reCAPTCHA is now disabled on your form.',
    },
    issueNotification: {
      enabled:
        'Email notifications for issues reported are now enabled on your form.',
      disabled:
        'Email notifications for issues reported are now disabled on your form.',
    },
    formTitleUpdated: "Your form's title has been updated.",
    inactiveMessageUpdated: "Your form's inactive message has been updated.",
    emailsUpdated: 'Emails successfully updated.',
    esrvcIdUpdated: 'E-service ID successfully updated.',
    authType: {
      enabled: 'Singpass authentication successfully enabled.',
      disabled: 'Singpass authentication successfully disabled.',
      updated: 'Singpass authentication successfully updated.',
    },
    submitterId: {
      enabled: 'NRIC/FIN/UEN collection is now enabled on your form.',
      disabled: 'NRIC/FIN/UEN collection is now disabled on your form.',
    },
    singleSubmission: {
      enabled:
        'Single submission per NRIC/FIN/UEN is now enabled on your form.',
      disabled:
        'Single submission per NRIC/FIN/UEN is now disabled on your form.',
    },
    whitelist: {
      uploaded: 'Your CSV has been uploaded successfully.',
      removed: 'Your CSV has been removed successfully.',
    },
    webhookUrl: {
      updated: 'Webhook URL successfully updated.',
      removed: 'Webhook URL successfully removed.',
    },
    webhookRetries: {
      enabled: 'Webhook retries have been enabled.',
      disabled: 'Webhook retries have been disabled.',
    },
    businessInfoUpdated: 'Business information has been updated.',
    gstUpdated: 'GST setting has been updated.',
  },
  emailNotifications,
  webhooks,
  payments,
  multiLanguage,
}

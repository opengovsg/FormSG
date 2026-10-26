import { enSG as emailNotifications } from './email-notifications'
import { enSG as general } from './general'
import { enSG as multiLanguage } from './multi-language'
import { enSG as payments } from './payments'
import { enSG as webhooks } from './webhooks'

export const enSG = {
  general,
  singpass: {
    title: 'Singpass',
    // One collapsible section per workflow step on multi-respondent forms.
    stepLogin: {
      stepHeader: 'Step {stepNumber} · {login}',
      removeFieldsFirst: 'Remove the Myinfo fields from this step first.',
      editStep: 'Edit step',
    },
    submitterIdCollection: {
      toggleLabel: 'Collect NRIC/FIN/UENs with form submissions',
      convert: 'Switch to using fields',
      learnMore: 'Learn more',
      stopCollecting: 'Stop collecting',
      makeTheSwitch: 'Make the switch',
      closeFormToConvert: 'Close your form to convert.',
      loginFieldsLockAuth:
        'To change your Singpass authentication mode, remove the existing login-filled fields.',
      removeIdentityFieldsFirst:
        'Your form already collects NRIC/FIN/UENs through form fields. To use this setting instead, remove those fields first.',
      autoConvertNotice:
        'Your form will automatically switch by end-June 2027.',
      otherFormsAutoConvertNotice:
        'Forms that still collect these through settings will automatically switch to form fields by end-June 2027.',
      preview: {
        howYouCollect: 'Example',
        automationWarning:
          'If you use webhooks or automations that read FormSG emails, review the full changes and update your automations before switching.',
        checkFullChanges: 'Check full changes to data',
        responsesUnchanged:
          'Past responses and NRIC limit settings stay the same.',
      },
      // Singpass converts to one field and Corppass to two, so each login has
      // its own sentences.
      singpass: {
        goToFields: 'Go to Singpass fields',
        switchHint: 'Switch to collecting NRIC/FIN using form fields.',
        stopTitle: 'Stop collecting NRIC/FIN',
        collectLaterDescription:
          'Add this field from the Singpass tab in the form builder.',
        stopDescription:
          'The next time you want to collect NRIC/FIN, you’ll need to add it as a field in your form.',
        movedToFields:
          'NRIC/FIN collection has moved from settings to Singpass form fields.',
        modalTitle: 'You’ll start collecting NRIC/FIN using form fields',
        outputTitle: 'NRIC/FIN will appear differently in new responses',
        collectionExplanation:
          'This field will be added to the end of your form and prefilled from Myinfo.',
      },
      corppass: {
        goToFields: 'Go to Corppass fields',
        switchHint: 'Switch to collecting NRIC/FIN and UEN using form fields.',
        stopTitle: 'Stop collecting NRIC/FIN and UEN',
        collectLaterDescription:
          'Add these fields from the Corppass tab in the form builder.',
        stopDescription:
          'The next time you want to collect NRIC/FIN and UEN, you’ll need to add them as fields in your form.',
        movedToFields:
          'NRIC/FIN and UEN collection has moved from settings to Corppass form fields.',
        modalTitle:
          'You’ll start collecting NRIC/FIN and UEN using form fields',
        outputTitle:
          'NRIC/FIN and UEN will appear differently in new responses',
        collectionExplanation:
          'These fields will be added to the end of your form and prefilled from Myinfo.',
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

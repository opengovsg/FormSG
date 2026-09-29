import { enSG as emailNotifications } from './email-notifications'
import { enSG as general } from './general'
import { enSG as multiLanguage } from './multi-language'
import { enSG as payments } from './payments'
import { enSG as webhooks } from './webhooks'

export const enSG = {
  general,
  singpass: {
    title: 'Singpass',
  },
  stepLogin: {
    title: 'Login for each step',
    newSubmissionsOnly:
      'Login and eligible-respondent changes apply to new submissions only. In-progress submissions keep their original settings.',
    closeFormToEdit:
      'To change Singpass settings, close your form to new responses.',
    laterStepsReadOnly:
      'Login for Steps 2 onwards is shown here but cannot be changed yet.',
    stepTitle: 'Step {stepNumber}',
    namedStepTitle: 'Step {stepNumber} — {stepName}',
    anyoneWithLink: 'Anyone with your form link',
    emailField: 'Email field: {title}',
    dropdownOptions: 'Emails assigned to options in {title}',
    deletedField: 'a deleted field',
    edit: 'Edit',
    editAriaLabel: 'Edit login for Step {stepNumber}',
    types: {
      nil: 'No login',
      myInfo: 'Singpass',
      cp: 'Corppass',
      sp: 'Singpass (legacy)',
      sgid: 'Singpass app-only (sgID)',
      sgidMyInfo: 'Singpass app-only with Myinfo (sgID)',
    },
    badges: {
      collectsNric: 'Collects NRIC/FIN',
      collectsUen: 'Collects UEN',
      onlyListedNrics: 'Eligible NRIC/FINs only',
      onlyListedUens: 'Eligible UENs only',
      oneResponseEach: 'One response per NRIC/FIN/UEN',
    },
    editor: {
      loginLabel: 'How do they log in?',
      free: 'Free',
      legacyProvider:
        'This step uses {provider}. Choose a login to replace it, or cancel to keep it.',
      collectNric: 'Collect NRIC/FIN with responses to this step',
      collectUen:
        'Collect UEN and Corppass user ID with responses to this step',
      singleSubmission: 'Limit each unique NRIC/FIN/UEN to one response',
      singleSubmissionPayments:
        'One response per NRIC/FIN/UEN is unavailable while payments are enabled.',
      esrvcIdLabel: 'Corppass e-service ID',
      esrvcIdDescription:
        'Shared by every Corppass step on this form. Saves with this step.',
      esrvcIdPlaceholder: 'Enter Corppass e-service ID',
      esrvcIdRequired: 'Enter the Corppass e-service ID to use Corppass.',
      esrvcIdWhitespace: 'e-service ID must not contain whitespace',
      myInfoRemoved:
        'These fields were removed from this step, not deleted from the form: {fields}',
      undo: 'Undo',
      noStepsMyInfo:
        '{fields} are Myinfo fields, so Step 1 needs Singpass. Keep Singpass, or delete them from the form first.',
      lastSingpassStep:
        'Keep a Singpass step or remove the remaining MyInfo fields from the form.',
      save: 'Save',
      cancel: 'Cancel',
      saved: 'Step {stepNumber} login was updated.',
    },
    whitelist: {
      nricTitle: 'Restrict Step {stepNumber} to eligible NRIC/FINs only',
      uenTitle: 'Restrict Step {stepNumber} to eligible UENs only',
      nricDescription:
        'Only NRIC/FINs in this list can fill in this step. The CSV file should list them in a single column with the "Respondent" header. [Download a sample .csv file](https://go.gov.sg/formsg-whitelist-respondents-sample-csv)',
      uenDescription:
        'Only UENs in this list can fill in this step. The CSV file should list them in a single column with the "Respondent" header. [Download a sample .csv file](https://go.gov.sg/formsg-whitelist-respondents-sample-csv)',
      replacesOnSave: 'The new list replaces the saved one when you save.',
      removesOnSave: 'The saved list is removed when you save.',
      droppedWithProvider:
        'The saved list is for the previous login and is removed when you save.',
    },
    esrvcId: {
      title: 'Corppass e-service ID',
      notSet: 'Not set',
      usedBy: 'Used by {steps}.',
      unused: 'No step uses Corppass yet.',
      change: 'Change',
      set: 'Set',
      modal: {
        title: 'Change Corppass e-service ID',
        description: 'Every Corppass step on this form uses this e-service ID.',
        descriptionShared:
          'This also changes it for {steps}, because every Corppass step on this form uses the same e-service ID.',
        cancel: 'Cancel',
        confirm: 'Save',
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

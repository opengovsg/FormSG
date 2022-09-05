import { AdminFormDto, FormStatus, PublicFormDto } from '~shared/types/form'

const GA = function () {
  return {
    gtag:
      window.gtag ||
      function () {
        return
      },
  }
}

export const trackAdminLogin = () => {
  GA().gtag('event', 'login', {
    event_category: 'admin_login',
  })
}

export const trackAdminLoginFailure = (error: string) => {
  GA().gtag('event', 'login', {
    event_category: 'admin_login_failure',
    message: error,
  })
}

export const trackCreateFormFailed = () => {
  GA().gtag('event', 'create_form', {
    event_category: 'create_form',
    event_action: 'Create Form failed',
  })
}

const trackPublicFormEvent = (
  eventAction: string,
  form: PublicFormDto,
  others?: Record<string, unknown>,
) => {
  if (form.status !== FormStatus.Public) {
    return
  }
  GA().gtag('event', 'public_form', {
    event_action: eventAction,
    form_title: form.title,
    form_id: form._id,
    ...others,
  })
}

export const trackVisitPublicForm = (form: PublicFormDto) => {
  return trackPublicFormEvent('visit', form)
}

export const trackSubmitForm = (form: PublicFormDto) => {
  return trackPublicFormEvent('submit_form_success', form)
}

export const trackSubmitFormFailure = (form: PublicFormDto) => {
  return trackPublicFormEvent('submit_form_failure', form)
}

/**
 * Logs client form reCAPTCHA onError.
 */
export const trackReCaptchaOnError = (form: PublicFormDto) => {
  return trackPublicFormEvent('reCAPTCHA connection failure', form)
}

/**
 * Logs the start of a storage mode responses download
 * @param adminForm The storage mode form
 * @param numWorkers The number of decryption workers
 * @param expectedNumSubmissions The expected number of submissions to download
 * @returns {Void}
 */
export const trackDownloadResponseStart = (
  adminForm: AdminFormDto,
  numWorkers: number,
  expectedNumSubmissions: number,
) => {
  GA().gtag('event', 'storage_mode', {
    event_action: 'download_start',
    form_title: adminForm.title,
    form_id: adminForm._id,
    num_workers: numWorkers,
    num_submission: expectedNumSubmissions,
  })
}

/**
 * Logs a successful storage mode responses download.
 * @param adminForm The storage mode form
 * @param numWorkers The number of decryption workers
 * @param expectedNumSubmissions The expected number of submissions to download
 * @param duration The duration taken by the download
 * @returns {Void}
 */
export const trackDownloadResponseSuccess = (
  adminForm: AdminFormDto,
  numWorkers: number,
  expectedNumSubmissions: number,
  duration: number,
) => {
  GA().gtag('event', 'storage_mode', {
    event_action: 'download_success',
    form_title: adminForm.title,
    form_id: adminForm._id,
    num_workers: numWorkers,
    num_submission: expectedNumSubmissions,
    duration: duration,
  })
}

/**
 * Logs a failed storage mode responses download.
 * @param adminForm The storage mode form
 * @param numWorkers The number of decryption workers
 * @param expectedNumSubmissions The expected number of submissions to download
 * @param duration The duration taken by the download
 * @param errorMessage The error message for the failure
 * @returns {Void}
 */
export const trackDownloadResponseFailure = (
  adminForm: AdminFormDto,
  numWorkers: number,
  expectedNumSubmissions: number,
  duration: number,
  errorMessage: string,
) => {
  GA().gtag('event', 'storage_mode', {
    event_action: 'download_success',
    form_title: adminForm.title,
    form_id: adminForm._id,
    num_workers: numWorkers,
    num_submission: expectedNumSubmissions,
    duration: duration,
    error_message: errorMessage,
  })
}

/**
 * Logs a failed attempt to even start storage mode responses download.
 * @param adminForm The storage mode form
 * @param errorMessage The error message for the failure
 * @returns {Void}
 */
export const trackDownloadNetworkFailure = (
  adminForm: AdminFormDto,
  errorMessage: string,
) => {
  GA().gtag('event', 'storage_mode', {
    event_action: 'network_failure',
    form_title: adminForm.title,
    form_id: adminForm._id,
    error_message: errorMessage,
  })
}

/**
 * Logs a successful storage mode responses download.
 * @param adminForm The storage mode form
 * @param numWorkers The number of decryption workers
 * @param expectedNumSubmissions The expected number of submissions to download
 * @param duration The duration taken by the download
 * @param errorCount The number of submissions that failed to decrypt
 * @param attachmentErrorCount The number of submissions attachments that failed to download (if any were requested)
 * @returns {Void}
 */
export const trackPartialDecryptionFailure = (
  adminForm: AdminFormDto,
  numWorkers: number,
  expectedNumSubmissions: number,
  duration: number,
  errorCount: number,
  attachmentErrorCount: number,
) => {
  GA().gtag('event', 'storage_mode', {
    event_action: 'partial_decrypt_error',
    form_title: adminForm.title,
    form_id: adminForm._id,
    num_workers: numWorkers,
    num_submission: expectedNumSubmissions,
    duration: duration,
    error_count: errorCount,
    attachment_error_count: attachmentErrorCount,
  })
}

/**
 * Logs clicking on mailto link to share form secret key with collaborators.
 */
export const trackClickSecretKeyMailTo = (formTitle: string) => {
  GA().gtag('event', 'storage', {
    event_action: 'Secret key mailto clicked',
    form_title: formTitle,
  })
}

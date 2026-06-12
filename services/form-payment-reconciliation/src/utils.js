const generateLinkToCloudwatch = (region, context) => {
  const { logGroupName, logStreamName } = context
  return (
    `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/` +
    encodeURIComponent(encodeURIComponent(logGroupName)) +
    '/log-events/' +
    encodeURIComponent(encodeURIComponent(logStreamName))
  )
}

const getPostToSlack = (apiSecret) => async (message) => {
  return fetch(`https://hooks.slack.com/services/${apiSecret}`, {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify({ text: message }),
  })
}

// The helpers below are duplicated from
// apps/backend/src/app/modules/payments/{stripe,payment.service}.utils.ts —
// keep the allow-lists in sync. This Lambda is a standalone deploy artifact
// with no path to import from the backend.

const getStripeMetadataForLogging = (metadata) => {
  if (!metadata) return undefined
  return {
    env: metadata.env,
    formId: metadata.formId,
    formTitle: metadata.formTitle,
    submissionId: metadata.submissionId,
    paymentId: metadata.paymentId,
  }
}

const getStripeObjectForLogging = (obj) => {
  if (!obj) return undefined
  return {
    id: obj.id,
    object: obj.object,
    status: obj.status,
    created: obj.created,
    amount: obj.amount,
    currency: obj.currency,
    metadata: getStripeMetadataForLogging(obj.metadata),
  }
}

const getStripeEventForLogging = (event) => {
  if (!event) return undefined
  return {
    id: event.id,
    type: event.type,
    account: event.account,
    created: event.created,
    livemode: event.livemode,
    object: getStripeObjectForLogging(event.data && event.data.object),
  }
}

const getPaymentLogMeta = (payment) => {
  if (!payment) return undefined
  return {
    _id: payment._id,
    status: payment.status,
    chargeIdLatest: payment.chargeIdLatest,
    formId: payment.formId,
    pendingSubmissionId: payment.pendingSubmissionId,
    paymentIntent: payment.paymentIntentId,
    targetAccountId: payment.targetAccountId,
    created: payment.created,
    lastModified: payment.lastModified,
    completedPayment: payment.completedPayment && {
      paymentDate: payment.completedPayment.paymentDate,
      submissionId: payment.completedPayment.submissionId,
      transactionFee: payment.completedPayment.transactionFee,
      receiptUrl: payment.completedPayment.receiptUrl,
      hasReceiptStoredInS3: payment.completedPayment.hasReceiptStoredInS3,
    },
  }
}

const getReconcileAccountResponseDataForLogging = (data) => {
  if (!data) return data
  return {
    eventsReport: (data.eventsReport || []).map(({ event, error }) => ({
      event: getStripeEventForLogging(event),
      error,
    })),
    reconciliationReport: (data.reconciliationReport || []).map(
      ({ payment, paymentIntent, mismatch, canceled }) => ({
        payment: getPaymentLogMeta(payment),
        paymentIntent: getStripeObjectForLogging(paymentIntent),
        mismatch,
        canceled,
      }),
    ),
  }
}

module.exports = {
  generateLinkToCloudwatch,
  getPostToSlack,
  getReconcileAccountResponseDataForLogging,
}

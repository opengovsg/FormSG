import axios from 'axios'

// Maildev default port is 1080.
const MAIL_URL = 'http://0.0.0.0:1080'

type MailParty = {
  address: string
  name: string
}

type MailAttachment = {
  fileName: string
  generatedFileName: string
}

type MailData = {
  id: string
  to: MailParty[]
  from: MailParty[]
  subject: string
  time: number
  html: string
  attachments: MailAttachment[] | null
}

type EmailSubmission = {
  responseId: string
  to: string[]
  from: string[]
  subject: string
  html: string
  attachments: Record<string, string>
}

// Sleep util, needed before getting mail to give mail server some time to receive email.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Utility to manage receiving of emails
 */
const MAIL_CLIENT = {
  getAll: async () => {
    await sleep(100) // Wait 100ms before getting emails, to give maildev time to sync.
    return axios.get<MailData[]>(`${MAIL_URL}/email`).then((res) => res.data)
  },

  deleteAll: () => axios.delete(`${MAIL_URL}/email/all`),

  deleteById: (id: string) => axios.delete(`${MAIL_URL}/email/${id}`),

  getAttachment: (id: string, filename: string) =>
    axios.get<string>(`${MAIL_URL}/email/${id}/attachment/${filename}`),
}

const getEmailsBy = async (
  filterFn: (email: MailData) => boolean,
): Promise<MailData[]> => {
  const inbox = await MAIL_CLIENT.getAll()
  return inbox.filter(filterFn).sort((a, b) => (a.time > b.time ? -1 : 1))
}

/**
 * Retrieves an OTP from the inbox.
 * @param recipient The email the OTP was sent to.
 */
export const extractOtp = async (recipient: string): Promise<string> => {
  const emails = await getEmailsBy((e) => e.to[0].address === recipient)

  const lastEmail = emails.pop()
  if (!lastEmail) throw Error(`mailbox for ${recipient} is empty`)

  const otp = lastEmail.html.match(/\d{6}/)?.[0]
  if (!otp) throw Error('otp was not found in email')

  await MAIL_CLIENT.deleteById(lastEmail.id)

  return otp
}

/**
 * Retrieves an email sent by FormSG.
 * @param {string} formName title of form
 * @param {string} responseId response ID of the submission
 * @returns {object} subject, sender, recipient and html content of email
 */
export const getSubmission = async (
  formName: string,
  responseId: string,
): Promise<EmailSubmission> => {
  const subject = `formsg-auto: ${formName} (#${responseId})`

  const emails = await getEmailsBy((e) => e.subject === subject)

  const lastEmail = emails.pop()
  if (!lastEmail) throw Error(`mailbox does not contain subject "${subject}"`)

  const submission = {
    responseId,
    to: lastEmail.to.map((p) => p.address),
    from: lastEmail.from.map((p) => p.address),
    subject: lastEmail.subject,
    html: lastEmail.html,
    attachments: await getSubmissionAttachments(lastEmail),
  }

  await MAIL_CLIENT.deleteById(lastEmail.id)

  return submission
}

// Fetches the file contents of each attachment and creates a record of filenames.
const getSubmissionAttachments = async (
  email: MailData,
): Promise<EmailSubmission['attachments']> => {
  if (!email.attachments) return {}
  const atts: Record<string, string> = {}
  for (const att of email.attachments) {
    const response = await MAIL_CLIENT.getAttachment(
      email.id,
      att.generatedFileName,
    )
    atts[att.fileName] = response.data
  }
  return atts
}

/**
 * Retrieves an autoreply email sent by FormSG.
 * @param {string} responseId response ID of the submission
 * @param {string} recipient email address of the form filler
 * @returns {MailData} email for the autoreply sent to the recipient
 */
export const getAutoreplyEmail = async (
  responseId: string,
  recipient: string,
): Promise<MailData> => {
  const emails = await getEmailsBy(
    (email) =>
      email.to[0].address === recipient &&
      email.html.includes(`Response ID: ${responseId}`),
  )

  const lastEmail = emails.pop()
  if (!lastEmail) {
    throw Error(
      `mailbox does not contain autoreply email for response ID ${responseId}`,
    )
  }

  await MAIL_CLIENT.deleteById(lastEmail.id)

  return lastEmail
}

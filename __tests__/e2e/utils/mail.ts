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

const getEmailsByRecipient = (
  inbox: MailData[],
  toEmail: string,
): MailData[] => {
  return inbox
    .filter((e) => e.to[0].address === toEmail)
    .sort((a, b) => (a.time > b.time ? -1 : 1))
}

const getEmailsBySubject = (inbox: MailData[], subject: string): MailData[] => {
  return inbox
    .filter((e) => e.subject === subject)
    .sort((a, b) => (a.time > b.time ? -1 : 1))
}

/**
 * Retrieves an OTP from the inbox.
 * @param email The email the OTP was sent to.
 */
export const extractOtp = async (email: string): Promise<string> => {
  const inbox = await MAIL_CLIENT.getAll()
  const emails = getEmailsByRecipient(inbox, email)

  const lastEmail = emails.pop()
  if (!lastEmail) throw Error(`mailbox for ${email} is empty`)

  const otp = lastEmail.html.match(/\d{6}/)?.[0]
  if (!otp) throw Error('otp was not found in email')

  await MAIL_CLIENT.deleteById(lastEmail.id)

  return otp
}

/**
 * Retrieves an email sent by FormSG.
 * @param {string} formName Title of form
 * @returns {object} subject, sender, recipient and html content of email
 */
export const getSubmission = async (
  formName: string,
  responseId: string,
): Promise<EmailSubmission> => {
  const subject = `formsg-auto: ${formName} (#${responseId})`

  const inbox = await MAIL_CLIENT.getAll()
  const emails = getEmailsBySubject(inbox, subject)

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

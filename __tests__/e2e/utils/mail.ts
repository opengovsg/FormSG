import axios from 'axios'
import get from 'lodash/get'

// Maildev default port is 1080.
const MAIL_URL = 'http://localhost:1080'

type MailData = {
  to: string[]
  time: number
  html: string
  id: string
}

/**
 * Utility to manage receiving of emails
 */
const MAIL_CLIENT = {
  getAll: () =>
    axios.get<MailData[]>(`${MAIL_URL}/email`).then((res) => res.data),

  deleteAll: () => axios.delete(`${MAIL_URL}/email/all`),

  deleteById: (id: string) => axios.delete(`${MAIL_URL}/email/${id}`),

  getAttachment: (id: string, filename: string) =>
    axios.get(`${MAIL_URL}/email/${id}/attachment/${filename}`),
}

const getEmailsTo = (inbox: MailData[], toEmail: string) => {
  return inbox
    .filter((e) => get(e, 'to[0].address') === toEmail)
    .sort((a, b) => (a.time > b.time ? -1 : 1))
}

/**
 * Retrieves an OTP from the inbox.
 */
export const extractOtp = async (
  email: string,
): Promise<string | undefined> => {
  let otp: string | undefined
  let lastEmail: MailData | undefined
  try {
    const inbox = await MAIL_CLIENT.getAll()
    const emails = getEmailsTo(inbox, email)
    lastEmail = emails.pop()
    otp = lastEmail?.html.match(/\d{6}/)?.[0]
  } catch (e) {
    throw Error('otp was not found in email')
  } finally {
    if (lastEmail) {
      await MAIL_CLIENT.deleteById(lastEmail.id)
    }
  }
  return otp
}

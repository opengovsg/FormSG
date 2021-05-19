import { jest } from '@jest/globals'
import { Transporter } from 'nodemailer'
import { mocked } from 'ts-jest/utils'

const transport = ({
  sendMail: jest.fn(),
} as unknown) as Transporter

jest.mock('nodemailer', () => ({
  createTransport: () => transport,
}))

// Exporting both as default and namespaced because nodemailer's main functionality
// is encapsulated by the Transporter type
export const mockTransport = mocked(transport, true)
export default mockTransport

const {
  MailService,
} = require('../../../../dist/backend/app/services/mail.service')
const { merge } = require('lodash')

fdescribe('mail.service', () => {
  const mockTransporter = jasmine.createSpyObj('transporter', ['sendMail'])
  const mailService = new MailService({
    transporter: mockTransporter,
  })

  const MOCK_MAIL_PARAMS = {
    to: 'to@example.com',
    from: 'from@example.com',
    subject: 'send node mail in tests',
    html: `<p>You are currently submitting a form.</p>`,
  }

  describe('sendNodeMail', () => {
    it('should receive correct response when mail is sent successfully', async () => {
      // Arrange
      // Mock response
      const mockedResponse = 'mockedSuccessResponse'
      mockTransporter.sendMail.and.callFake(() => mockedResponse)

      // Act + Assert
      await expectAsync(
        mailService.sendNodeMail(MOCK_MAIL_PARAMS),
      ).toBeResolvedTo(mockedResponse)
    })

    it('should reject with error when mail sending throws an error', async () => {
      // Arrange
      // Mock rejection with 4xx error
      const expectedError = merge(new Error('Rejected'), { responseCode: 404 })
      mockTransporter.sendMail.and.throwError(expectedError)

      // Act + Assert
      await expectAsync(
        mailService.sendNodeMail(MOCK_MAIL_PARAMS),
      ).toBeRejectedWith(expectedError)
    })

    it('should reject with error when mail params are missing', async () => {
      // Act + Assert
      await expectAsync(mailService.sendNodeMail()).toBeRejectedWithError(
        'Mail undefined error',
      )
    })

    it('should reject with error when invoked with invalid `to` email', async () => {
      // Arrange
      const invalidMailParams = { ...MOCK_MAIL_PARAMS, to: 'notAnEmailAddress' }

      // Act + Assert
      await expectAsync(
        mailService.sendNodeMail(invalidMailParams),
      ).toBeRejectedWithError('Invalid email error')
    })
  })

  describe('sendVerificationOtp', () => {})
})

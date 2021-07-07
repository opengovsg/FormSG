const { signInPage, formList, landingPage } = require('./helpers/selectors')
const {
  getPageUrl,
  enterEmail,
  extractOTP,
  enterOTPAndExpect,
  expectOtpSent,
  makeMongooseFixtures,
  makeModel,
  appUrl,
  deleteDocById,
} = require('./helpers/util')

let db
let User
let Agency
let Token
let govTech
let createUser
let deleteToken
fixture('login')
  .page(appUrl + '/#!/signin')
  .before(async () => {
    db = await makeMongooseFixtures()
    Agency = makeModel(db, 'agency.server.model', 'Agency')
    User = makeModel(db, 'user.server.model', 'User')
    Token = makeModel(db, 'token.server.model', 'Token')
    govTech = await Agency.findOne({ shortName: 'govtech' }).exec()
    createUser = async (email) => {
      return new User({
        email,
        agency: govTech._id,
        contact: '+6587654321',
      })
        .save()
        .catch((error) => console.error(error))
    }
    deleteToken = async (email) => {
      return Token.deleteOne({ email }).catch((error) => console.error(error))
    }
  })
  .after(async () => {
    // Delete models defined by mongoose and close connection
    db.models = {}
    await db.close()
  })

test('Reject emails that do not have white-listed domains', async (t) => {
  // Enter email
  await enterEmail(t, 'user@non-white-listed-agency.com')

  // Ensure error message is seen
  await t
    .expect(signInPage.emailErrorMsg.textContent)
    .contains(
      'Please log in with your official government or government-linked email address.',
    )
})

test

  .before(async (t) => {
    t.ctx.user = await createUser('existinguser@data.gov.sg')
  })
  .after(async (t) => {
    await deleteToken(t.ctx.user.email)
    await deleteDocById(User, t.ctx.user._id)
  })(
  'Send otp to emails that have white-listed domains (Current User flow)',
  async (t) => {
    let email = t.ctx.user.email
    // Enter email
    await enterEmail(t, email)

    // Ensure that 'OTP sent' success message is shown
    await expectOtpSent(t, email)

    // Enter OTP
    let otp = await extractOTP(email)
    await enterOTPAndExpect({ t, otp, isValid: true, email })
  },
)

test

  .before((t) => {
    t.ctx.email = 'newuser@data.gov.sg'
  })
  .after(async (t) => {
    await deleteToken(t.ctx.email)
  })(
  'Send otp to emails that have white-listed domains (New User flow)',
  async (t) => {
    let email = t.ctx.email
    // Enter email
    await enterEmail(t, email)

    // Ensure that 'OTP sent' success message is shown
    await expectOtpSent(t, email)

    // Enter OTP
    let otp = await extractOTP(email)
    await enterOTPAndExpect({ t, otp, isValid: true, email })
  },
)

test

  .before(async (t) => {
    t.ctx.user = await createUser('preventuseremail@data.gov.sg')
  })
  .after(async (t) => {
    await deleteToken(t.ctx.user.email)
    await deleteDocById(User, t.ctx.user._id)
  })('Prevent sign-in if OTP is incorrect', async (t) => {
  let email = t.ctx.user.email
  // Enter email
  await enterEmail(t, email)

  // Ensure that 'OTP sent' success message is shown
  await expectOtpSent(t, email)

  // Get correct otp
  let correctOtp = await extractOTP(email)

  // Generate incorrect otp by replacing digit in first index with its complement
  // i.e. 123456 becomes 923456
  let incorrectOtp =
    9 - parseInt(correctOtp.substring(0, 1)) + correctOtp.substring(1)

  // Ensure that invalid otp is not accepted
  await enterOTPAndExpect({ t, otp: incorrectOtp, isValid: false, email })

  // Remove current OTP and enter correct OTP
  await t.selectText(signInPage.otpInput).pressKey('delete')
  await enterOTPAndExpect({ t, otp: correctOtp, isValid: true, email })
})

test

  .before(async (t) => {
    t.ctx.user = await createUser('resenduseremail@data.gov.sg')
  })
  .after(async (t) => {
    await deleteToken(t.ctx.user.email)
    await deleteDocById(User, t.ctx.user._id)
  })('Resend OTP on request and invalidate old OTP', async (t) => {
  let email = t.ctx.user.email
  // Enter email
  await enterEmail(t, email)

  // Ensure that 'OTP sent' success message is shown
  await expectOtpSent(t, email)

  // Extract first OTP
  let firstOtp = await extractOTP(email)

  // Click resend Otp
  await t.click(signInPage.resendOtpLink)
  await expectOtpSent(t, email)

  // Extract second OTP
  let secondOtp = await extractOTP(email)

  // Reject invalidated OTP
  await enterOTPAndExpect({ t, otp: firstOtp, isValid: false, email })

  // Remove current OTP and enter correct OTP
  await t.selectText(signInPage.otpInput).pressKey('delete')
  await enterOTPAndExpect({ t, otp: secondOtp, isValid: true, email })
})

test

  .before(async (t) => {
    t.ctx.user = await createUser('logoutuseremail@data.gov.sg')
  })
  .after(async (t) => {
    await deleteToken(t.ctx.user.email)
    await deleteDocById(User, t.ctx.user)
  })('Should logout to main screen', async (t) => {
  let email = t.ctx.user.email
  // Enter email
  await enterEmail(t, email)

  // Ensure that 'OTP sent' success message is shown
  await expectOtpSent(t, email)

  // Extract OTP and log in
  let otp = await extractOTP(email)
  await enterOTPAndExpect({ t, otp, isValid: true, email })

  await t.click(formList.avatarDropdown)
  await t.click(formList.logOutBtn)
  await t
    .expect(getPageUrl())
    .eql(appUrl + '/#!/')
    // Due to text spanning multiple spans, remove all whitespace
    .expect((await landingPage.tagline.textContent).replace(/  +/g, ' '))
    .contains('Build government forms in minutes')
})

test('Prevent sign-in if email is invalid', async (t) => {
  let email = t.ctx.user.email
  // Enter email
  await enterEmail(t, email)

  t.expect(signInPage.emailErrorMsg().textContent).contains(
    'Please enter a valid email',
  )
})

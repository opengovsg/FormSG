import { Login } from '.'

export const enSG: Login = {
  LoginPage: {
    slogan: 'Build secure government forms in minutes',
    banner: 'You can now collect payments directly on your form!',
    expiredSgIdSession:
      'Your sgID login session has expired. Please login again.',
  },
  SelectProfilePage: {
    accountSelection: 'Choose an account to continue to FormSG',
    manualLogin: 'Or, login manually using email and OTP',
    noWorkEmailHeader: "Singpass login isn't available to you yet",
    noWorkEmailBody:
      'It is progressively being made available to agencies. In the meantime, please log in using your email address.',
    noWorkEmailCta: 'Back to login',
    invalidWorkEmailHeader: "You don't have access to this service",
    invalidWorkEmailBodyRestriction:
      'It may be available only to select agencies or authorised individuals. If you believe you should have access to this service, please',
    invalidWorkEmailBodyContact: 'contact us',
    invalidWorkEmailCta: 'Choose another account',
  },
  components: {
    LoginForm: {
      onlyAvailableForPublicOfficers:
        'Log in with a .gov.sg or other whitelisted email address',
      emailEmptyErrorMsg: 'Please enter an email address',
      login: 'Log in',
      haveAQuestion: 'Have a question?',
    },
    OTPForm: {
      signin: 'Sign in',
      otpRequired: 'OTP is required.',
      otpLengthCheck: 'Please enter a 6 digit OTP.',
      otpTypeCheck: 'Only numbers are allowed.',
      otpFromEmail: 'Enter OTP sent to {email}',
    },
    SgidLoginButton: {
      forText: 'For',
      selectAgenciesText: 'select agencies',
      loginText: 'Log in with',
      appText: 'app',
    },
  },
}

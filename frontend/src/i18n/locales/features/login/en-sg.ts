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
    invalidWorkEmail:
      'It may be available only to select agencies or authorised individuals. If you believe you should have access to this service, please <2><0>contact us</0></2>',
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
      selectAgencies: 'For <2><0>select agencies</0></2>',
    },
  },
}

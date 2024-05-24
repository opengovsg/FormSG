export * from './en-sg'
export * from './zh-sg'

export interface Login {
  components: {
    LoginForm: {
      onlyAvailableForPublicOfficers: string
      emailEmptyErrorMsg: string
      login: string
      haveAQuestion: string
    }
    OTPForm: {
      signin: string
      otpRequired: string
      otpLengthCheck: string
      otpTypeCheck: string
      otpFromEmail: string
    }
    SgidLoginButton: {
      selectAgencies: string
    }
  }
  LoginPage: {
    slogan: string
    banner: string
    expiredSgIdSession: string
  }
  SelectProfilePage: {
    accountSelection: string
    manualLogin: string
    invalidWorkEmail: string
  }
}

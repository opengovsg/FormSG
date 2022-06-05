import Translation from './types'

export const zhSG: Translation = {
  translation: {
    general: {
      languageName: '中文',
    },
    features: {
      publicForm: {
        components: {
          FormFields: {
            PublicFormSubmitButton: {
              submissionDisabled: '不允许提交',
              submitNow: '提交表格',
              submitting: '正在提交...',
            },
          },
        },
      },
      login: {
        LoginPage: {
          slogan: '在几分钟内创建安全的政府表格',
        },
        components: {
          LoginForm: {
            onlyAvailableForPublicOfficers:
              '只供拥有 gov.sg 电子邮件的公职人员使用',
            email: '电子邮件地址',
            emailEmptyErrorMsg: '请输入电子邮件地址',
            login: '登录',
            haveAQuestion: '有问题？',
          },
        },
      },
    },
  },
}

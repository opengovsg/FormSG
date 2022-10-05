import Translation from './types'

export const zhSG: Translation = {
  translation: {
    features: {
      login: {
        LoginPage: {
          slogan: '在几分钟内创建安全的政府表格',
        },
        components: {
          LoginForm: {
            onlyAvailableForPublicOfficers:
              '只供拥有 gov.sg 或其他列入白名单的电子邮件的公职人员使用',
            emailEmptyErrorMsg: '请输入电子邮件地址',
            login: '登录',
            haveAQuestion: '有问题？',
          },
        },
      },
    },
  },
}

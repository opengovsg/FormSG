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
            email: '电子邮件地址',
            emailEmptyErrorMsg: '请输入电子邮件地址',
            login: '登录',
            haveAQuestion: '有问题？',
          },
        },
      },
    },
    pages: {
      Landing: {
        LandingPage: {
          hero: {
            slogan: '在几分钟内创建安全的政府表格',
            subtitle:
              '一个免费、易于使用、无代码的表格生成器，具有高级功能，供公职人员安全收集机密和敏感数据。',
            buttonText: '立即开始构建您的表格',
          },
          features: {
            title: '我们的表格构建和数据收集功能',
            dragAndDropBuilder: {
              title: '拖放生成表格',
              text: '使用我们用户友好的拖放构建器，在几分钟内创建和发布表格。构建器其中包含超过 65 种字段类型，包括附件、日期、表格、评级等等。',
            },
            accessible: {
              title: '无障碍',
              text: '我们所有的表格都具有充分的响应能力，满足互联网内容可访问性指南 (WCAG 2.1)，该指南使残障人士更容易访问互联网内容。',
            },
            conditionalLogic: {
              title: '条件逻辑',
              text: '为您的表格创建高级逻辑，并根据用户的输入显示或隐藏字段和/或部分，从而个性化他们的体验。',
            },
            governmentIntegrations: {
              title: '政府集成',
              text: '使用 Singpass 或 Corppass 对您的用户进行身份验证。 一旦公民通过 Singpass 登录，也可以预先填写 MyInfo。',
            },
            webhooks: {
              title: '网络挂钩 (Webhook)',
              text: '将每个表格提交直接发送到兼容的网络应用程序。',
            },
            formSections: {
              title: '表格部分',
              text: '通过对长表格进行分段来管理，以便您的用户享受更加无缝的体验。',
            },
            prefill: {
              title: '表格预填',
              text: '通过为用户预填字段来加快用户的表格填写过程。',
            },
            emailConfirmation: {
              title: '电子邮件确认',
              text: '向您的用户者发送确认电子邮件以及他们的回复副本。',
            },
          },
        },
      },
    },
  },
}

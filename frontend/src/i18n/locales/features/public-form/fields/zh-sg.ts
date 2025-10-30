import { PartialDeep } from 'type-fest'

import { Fields } from '.'

export const zhSG: PartialDeep<Fields> = {
  yesNo: {
    yes: '是',
    no: '否',
  },
  option: {
    others: '其他',
  },
  dropdown: {
    placeholder: '请选择一个选项',
    nothingFound: '没有匹配结果',
    clearSelection: '清除选择',
    selectOptions: '选择选项',
  },
  attachment: {
    maxFileSize: '文件限制：不超过 {readableMaxSize}',
  },
  email: {
    validation: {
      domainDisallowed: '输入的电子邮箱不在允许域名之列',
    },
  },
  verification: {
    button: {
      label: {
        verify: '验证',
        verified: '已验证',
      },
    },
    modal: {
      email: {
        title: '验证您的电子邮箱',
        description: '已通过电邮发送6位数的验证码，30分钟内有效。',
      },
      mobile: {
        title: '验证您的手机号码',
        description: '已通过短信发送6 位数的验证码，30分钟内有效。',
      },
    },
  },
}

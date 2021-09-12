const { Selector } = require('testcafe')
const {
  types: basicTypes,
} = require('../../../dist/backend/shared/constants/field/basic')
const {
  types: myInfoTypes,
} = require('../../../dist/backend/shared/constants/field/myinfo')

const landingPage = {
  tagline: Selector('#tagline'),
}

// Signin page
const signInPage = {
  emailInput: Selector('#email-input'),
  getStartedBtn: Selector('.btn-grp').child('button').withText('GET STARTED'),
  otpMsg: Selector('.alert-custom'),
  otpInput: Selector('#otp-input'),
  signInBtn: Selector('.btn-grp').child('button').withText('SIGN IN'),
  emailErrorMsg: Selector('.alert-error'),
  resendOtpLink: Selector('a').withText('Resend OTP'),
}
// Form list dashboard and create form modal
const formList = {
  createFormBtn: Selector('#list-form #create-new, #list-form #welcome-btn'),
  welcomeMessage: Selector('#list-form #welcome'),
  avatarDropdown: Selector('.navbar__avatar'),
  logOutBtn: Selector('.navbar__dropdown__logout'),
}
const createFormModal = {
  startFromScratchBtn: Selector('#start-from-scratch-button'),
  templateCard: Selector('#form-card').nth(3), // volunteer registration
  formTitleInput: Selector('#settings-name').parent(),
  emailModeRadio: Selector('#settings-form input[value="email"]').parent(),
  encryptModeRadio: Selector('#settings-form input[value="encrypt"]').parent(),
  emailListInput: Selector('#settings-email').parent(),
  startBtn: Selector('#btn-create'),
  secretKeyDiv: Selector('.copy-key .text'),
  downloadKeyBtn: Selector('#create-form-secret-key i.bx-download').parent(),
  encryptModeContinueBtn: Selector('#btn-continue'),
}
const createFormTemplateModal = {
  useTemplateBtn: Selector('.use-template-btn'),
}
// Admin tabs navbar
const adminTabParent = Selector('#admin-tabs-container')
const adminTabs = {
  build: adminTabParent.child('li[heading="Build"]'),
  logic: adminTabParent.child('li[heading="Logic"]'),
  settings: adminTabParent.child('li[heading="Settings"]'),
  share: adminTabParent.child('li[heading="Share"]'),
  data: adminTabParent.child('li[heading="Data"]'),
}
// Maps fieldType property to text of field panels in the Build tab
const BASIC_FIELD_TYPE_TO_VALUE = {}
basicTypes.forEach((type) => {
  BASIC_FIELD_TYPE_TO_VALUE[type.name] = type.value
})
const MYINFO_ATTR_TO_VALUE = {}
myInfoTypes.forEach((type) => {
  MYINFO_ATTR_TO_VALUE[type.name] = type.value
})
// Admin tab contents
const buildTab = {
  basicTab: Selector('#add-field .nav-tabs li[heading="Basic"]'),
  myInfoTab: Selector('#add-field .nav-tabs li').withText('MyInfo'),
  getFieldPanel: (fieldType) =>
    // We need withExactText otherwise Mobile Number will match Number
    Selector('.add-field-panel .add-field-text').withExactText(
      BASIC_FIELD_TYPE_TO_VALUE[fieldType],
    ),
  getMyInfoPanel: (myInfoAttr) =>
    Selector('.add-field-panel .add-field-text').withExactText(
      MYINFO_ATTR_TO_VALUE[myInfoAttr],
    ),
}
const logicTab = {
  addLogicBtn: Selector('#add-new-logic'),
}

const settingsTab = {
  formStatus: Selector('#golive-option'),
  activateBtn: Selector('#btn-live'),
  getAuthRadioInput: (authType) => Selector(`#auth-type-${authType}`),
  getAuthRadioLabel: (authType) => Selector(`#auth-type-${authType}`).parent(),
  esrvcIdInput: Selector('#enable-auth-options input[type="text"]'),
  captchaToggleInput: Selector('#enable-captcha input'),
  captchaToggleLabel: Selector('#enable-captcha input').parent(),
  formTitleInput: Selector('#settings-name'),
  emailListInput: Selector('#settings-email'),
  webhookUrlInput: Selector('#settings-webhook-url'),
}

const dataTab = {
  secretKeyInput: Selector('#secretKeyInput'),
  unlockResponsesBtn: Selector('button').withText('UNLOCK RESPONSES'),
  getNthSubmission: (n) => Selector('#responses-tab tbody tr').nth(n),
  getNthFieldTitle: (n) => Selector('.response-title-container').nth(n),
  getNthFieldAnswer: (n) => Selector('.response-answer').nth(n),
  getNthFieldDownloadLink: (n) => Selector('.response-answer').nth(n).find('a'),
  exportBtn: Selector('#btn-export-dropdown'),
  exportBtnDropdownResponses: Selector('#btn-export-dropdown-responses'),
  getNthFieldTableCell: (n, row, col) =>
    Selector('.response-answer')
      .nth(n)
      .find('.table-row')
      .nth(row + 1) // Header is also a row
      .find('.table-column')
      .nth(col)
      .find('input'),
}

// Edit field modal
const editFieldModal = {
  title: Selector('input[name="title"]'),
  saveBtn: Selector('.modal-save-btn'),
  getToggle: (toggleText) =>
    Selector('.toggle-option div')
      .withText(toggleText)
      .nextSibling()
      .find('.toggle-selector'),
  getOptionInput: (n) => Selector('.option-panel .option').nth(n).find('input'),
  optionTextArea: Selector('.optionFrom').find('textarea'),
  minValInput: Selector('.min-val-input'),
  maxValInput: Selector('.max-val-input'),
  addOption: Selector('a').withText('Add Option'),
  rating: {
    ratingStepsDropdown: Selector('.ui-select-container').nth(0),
    ratingShapeDropdown: Selector('.ui-select-container').nth(1),
  },
  table: {
    tableMinRows: Selector('input[type="number"]').parent(),
    getNthColTitle: (n) =>
      Selector('.table-column-card').nth(n).find('input[type="text"]'),
    getNthColFieldType: (n) =>
      Selector('.table-column-card').nth(n).find('.table-column-dropdown'),
    getNthColRequiredToggle: (n) =>
      Selector('.table-column-card').nth(n).find('.toggle-selector'),
    getNthColTextArea: (n) =>
      Selector('.table-column-card').nth(n).find('textarea'),
    addColumn: Selector('#add-column'),
  },
  attachmentSizeDropdown: Selector('.ui-select-container'),
}

// Activate form modal
const activateFormModal = {
  secretKeyInput: Selector('#secretKeyInput'),
  acknowledgementInput: Selector('#acknowledgementInput'),
  activateFormBtn: Selector('button').withText('ACTIVATE FORM'),
  closeModalBtn: Selector('#btn-close'),
}

// Edit logic modal
const editLogicModal = {
  getNthConditionField: (n) =>
    Selector('.if-container').nth(n).find('.field-input').nth(0),
  getNthConditionState: (n) =>
    Selector('.if-container').nth(n).find('.field-input').nth(1),
  getNthConditionValue: (n) =>
    Selector('.if-container').nth(n).find('.field-input').nth(2),
  // The multi option is used for ifValueType=multi-select, when
  // selecting more than one element
  getNthConditionValueMulti: (n) =>
    Selector('.if-container')
      .nth(n)
      .find('.field-input')
      .nth(2)
      .find('input[type="search"]'),
  addConditionBtn: Selector('.if-btn-container')
    .nth(0)
    .find('.add-condition-btn'),
  showFieldsBtn: Selector('.show-fields-option'),
  preventSubmitBtn: Selector('.prevent-submit-option'),
  showFieldsDropdown: Selector('.show-fields-container .field-input'),
  showFieldsSearch: Selector('.show-fields-container input[type="search"]'),
  preventSubmitTextArea: Selector('.prevent-submit-container textarea'),
  saveBtn: Selector('.modal-save-btn'),
}

// Form submission
const formPage = {
  startTitle: Selector('#start-page-title'),
  endTitle: Selector('#end-page-title'),
  getFieldElement: (id, element = '') =>
    Selector(`div[data-id="${id}"] ${element}`),
  getTableCell: (id, row, col) => {
    return Selector(`div[data-id="${id}"] .table-row`)
      .nth(row + 1) // + 1 because the header is also a row
      .find(`.table-column`)
      .nth(col)
  },
  submitBtn: Selector('#form-submit button'),
  submitPreventedMessage: Selector('#submit-prevented-message'),
  spcpLoginBtn: Selector('#start-page-btn-container button span').withText(
    'LOGIN',
  ),
  spcpLogoutBtn: Selector('#start-page-btn-container button span').withText(
    'LOG OUT',
  ),
}

const mockpass = {
  loginBtn: Selector('.container.visible-lg #loginModelbtn'),
  consentBtn: Selector('input[type=submit]'),
  nricDropdownBtn: Selector('#dropdownMenuButton'),
  getNricOption: (nric) => Selector('.dropdown-menu li').withText(nric),
  getNricUenOption: (nric, uen) =>
    Selector('.dropdown-menu li').withText(nric).withText(uen),
}

module.exports = {
  formList,
  createFormModal,
  createFormTemplateModal,
  adminTabs,
  settingsTab,
  signInPage,
  dataTab,
  landingPage,
  formPage,
  buildTab,
  editFieldModal,
  activateFormModal,
  logicTab,
  editLogicModal,
  mockpass,
}

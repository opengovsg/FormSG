import { Page } from '@playwright/test'
import cuid from 'cuid'
import { format } from 'date-fns'
import {
  BASICFIELD_TO_DRAWER_META,
  MYINFO_FIELD_TO_DRAWER_META,
} from 'frontend/src/features/admin-form/create/constants'
import { readFileSync } from 'fs'
import {
  BasicField,
  DateSelectedValidation,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  LogicConditionState,
  LogicType,
  MyInfoAttribute,
  NumberSelectedValidation,
} from 'shared/types'

import { IFormModel, IFormSchema } from 'src/types'

import {
  ADMIN_FORM_PAGE_CREATE,
  ADMIN_FORM_PAGE_PREFIX,
  ADMIN_FORM_PAGE_SETTINGS,
  DASHBOARD_PAGE,
  E2eFieldMetadata,
  E2eForm,
  E2eFormResponseMode,
  E2eLogic,
  E2eSettingsOptions,
  NON_INPUT_FIELD_TYPES,
} from '../constants'
import { expect } from '../fixtures/auth'
import {
  expectToast,
  fillDropdown,
  fillMultiDropdown,
  getMyInfoAttribute,
  getTitleWithQuestionNumber,
} from '../utils'

type CreateFormReturn = {
  form: IFormSchema
  formResponseMode: E2eFormResponseMode
}

/**
 * Navigates to the dashboard and creates a new form with all the associated form settings.
 * @param {Page} page Playwright page
 * @param {IFormMode} Form the Form database model
 * @param {FormResponseMode} responseMode the type of form to be created - Email or Encrypt
 * @param {E2eForm} e2eForm the form details to be created
 * @returns {CreateFormReturn} the created form as found in the db along with the secret key, if it is a storage form
 */
export const createForm = async (
  page: Page,
  Form: IFormModel,
  responseMode: FormResponseMode,
  { formFields, formLogics, formSettings }: E2eForm,
): Promise<CreateFormReturn> => {
  const { formId, formResponseMode } = await addForm(page, responseMode)
  await addSettings(page, { formId, formResponseMode, formSettings })
  await addFieldsAndLogic(page, { formId, formFields, formLogics })

  const form = await Form.findById(formId)
  if (!form) throw Error('Form not found in db')

  return { form, formResponseMode }
}

type AddFormReturn = {
  formId: string
  formResponseMode: E2eFormResponseMode
}

/**
 * Navigates to the dashboard and creates a new form. Ends on the admin builder page.
 * @param {Page} page Playwright page
 * @param {FormResponseMode} responseMode the type of form to be created - Email or Encrypt
 * @returns {AddFormReturn} the created form id and the secret key, if it is a storage form
 */
const addForm = async (
  page: Page,
  responseMode: FormResponseMode,
): Promise<AddFormReturn> => {
  await page.goto(DASHBOARD_PAGE)

  // Press escape 5 times to get rid of any banners
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Create form' }).click()

  await page.getByLabel('Form name').fill(`e2e-test-${cuid()}`)

  await page
    .getByText(
      `${responseMode === FormResponseMode.Email ? 'email' : 'storage'} mode`,
    )
    .click()
  await page.getByRole('button', { name: 'Next step' }).click()

  let formResponseMode: E2eFormResponseMode = {
    responseMode: FormResponseMode.Email,
  }
  if (responseMode === FormResponseMode.Encrypt) {
    // Download the secret key and save it for the test.
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download key' }).click()
    const download = await downloadPromise
    const path = await download.path()
    if (!path) throw new Error('Secret key download failed')
    formResponseMode = {
      responseMode: FormResponseMode.Encrypt,
      secretKey: readFileSync(path).toString(),
    }

    // Double check that the secret key exists on the screen.
    await expect(
      page.getByText(formResponseMode.secretKey, { exact: true }),
    ).toBeVisible()

    // Click acknowledgement buttons
    await page.getByText(/If I lose my Secret Key/).click()
    await page
      .getByRole('button', {
        name: 'I have saved my Secret Key safely',
      })
      .click()
  }

  await expect(page).toHaveURL(new RegExp(`${ADMIN_FORM_PAGE_PREFIX}/.*`, 'i'))

  const l = ADMIN_FORM_PAGE_PREFIX.length + 1
  const formId = page
    .url()
    .match(new RegExp(`${ADMIN_FORM_PAGE_PREFIX}/[a-fA-F0-9]{24}`))?.[0]
    .slice(l, l + 24)

  if (!formId) throw new Error('FormId not found in page url')

  // Clear any banners
  await page.getByRole('button', { name: 'Next' }).press('Escape')

  return { formId, formResponseMode }
}

/** Goes to settings page and adds settings, and toggle form to be open.
 * @param {Page} page Playwright page
 * @param {string} formId the formId
 * @param {E2eSettingsOptions} formSettings the form settings to update
 */
const addSettings = async (
  page: Page,
  {
    formId,
    formResponseMode,
    formSettings,
  }: {
    formId: string
    formResponseMode: E2eFormResponseMode
    formSettings: E2eSettingsOptions
  },
): Promise<void> => {
  await page.getByText('Settings').click()
  await expect(page).toHaveURL(ADMIN_FORM_PAGE_SETTINGS(formId))

  await addGeneralSettings(page, formSettings)
  await addAdminEmails(page, formSettings)
  await addAuthSettings(page, formSettings)
  await addCollaborators(page, formSettings)

  // Open the form as the last thing to do!
  if (formSettings.status === FormStatus.Public) {
    // Go back to general settings, to open the form if necessary!
    await page.getByRole('tab', { name: 'General' }).dispatchEvent('click')

    // Ensure that we are on the general settings page
    await expect(
      page.getByRole('heading', { name: 'General settings' }),
    ).toBeVisible()

    // Toggle form to be open
    await page
      .locator('label', {
        has: page.locator('[aria-label="Toggle form status"]'),
      })
      .click()

    if (formResponseMode.responseMode === FormResponseMode.Encrypt) {
      // Upload the secret key and confirm to open the form.
      await page
        .getByPlaceholder('Enter or drop your Secret Key to continue')
        .fill(formResponseMode.secretKey)
      await page
        .locator('label')
        .filter({ hasText: 'If I lose my key' })
        .click()
      await page.getByRole('button', { name: 'Activate form' }).click()
    }

    // Check toast
    await expectToast(page, /your form is now open/i)

    // Check new label
    await expect(
      page.getByText(/your form is open to new responses/i),
    ).toBeVisible()
  }
}

/** Goes to general settings page and adds general settings.
 * Precondition: must be on the admin form settings page.
 * @param {Page} page Playwright page
 * @param {E2eSettingsOptions} formSettings the form settings to update
 */
const addGeneralSettings = async (
  page: Page,
  formSettings: E2eSettingsOptions,
): Promise<void> => {
  await page.getByRole('tab', { name: 'General' }).click()

  // Ensure that we are on the general settings page
  await expect(
    page.getByRole('heading', { name: 'General settings' }),
  ).toBeVisible()

  await expectToast(page, /your form is closed to new responses/i)

  // Turn off captcha, since we can't test for that
  await page
    .locator('label', {
      has: page.locator('[aria-label="Enable reCAPTCHA"]'),
    })
    .click()

  await expectToast(page, /recaptcha is now disabled on your form/i)

  if (formSettings.responseLimit) {
    await page
      .locator('label', {
        has: page.locator('[aria-label="Set a response limit"]'),
      })
      .click()

    // Check toast
    await expectToast(
      page,
      /your form will now automatically close on the .* submission/i,
    )

    await page
      .getByLabel('Maximum number of responses allowed')
      .fill(String(formSettings.responseLimit))

    await page.keyboard.down('Enter')

    // Check toast
    await expectToast(
      page,
      /your form will now automatically close on the .* submission/i,
    )
  }

  if (formSettings.closedFormMessage) {
    await page
      .getByLabel('Set message for closed form')
      .fill(formSettings.closedFormMessage)
  }
}

/** Goes to Singpass settings frame and adds auth settings.
 * Precondition: must be on the admin form settings page.
 * @param {Page} page Playwright page
 * @param {E2eSettingsOptions} formSettings the form settings to update
 */
const addAuthSettings = async (
  page: Page,
  formSettings: E2eSettingsOptions,
): Promise<void> => {
  if (formSettings.authType === FormAuthType.NIL) return

  await page.getByRole('tab', { name: 'Singpass' }).click()

  // Ensure that we are on the auth page
  await expect(page.getByRole('heading', { name: 'Singpass' })).toBeVisible()

  await page
    .locator('label', {
      has: page.locator('[aria-label="Enable Singpass authentication"]'),
    })
    .click()

  await expectToast(page, /singpass authentication successfully enabled/i)

  // Don't need to click if SGID is desired auth type
  // since SGID is the default once Singpass is enabled
  if (formSettings.authType !== FormAuthType.SGID) {
    await page
      .locator('label', {
        has: page.locator(
          `input[type='radio'][value='${formSettings.authType}']`,
        ),
      })
      .first() // Since 'Singpass' will match all radio options, pick the first matching one.
      .click({ position: { x: 1, y: 1 } }) // Clicking the center of the sgid button launches the sgid contact form, put this here until we get rid of the link

    await expectToast(page, /singpass authentication successfully updated/i)
  }

  switch (formSettings.authType) {
    case FormAuthType.SP:
    case FormAuthType.CP:
    case FormAuthType.MyInfo:
      if (!formSettings.esrvcId) throw new Error('No esrvcid provided!')
      await page.locator(`id=esrvcId`).fill(formSettings.esrvcId)
      await page.keyboard.press('Enter')
      await expectToast(page, /e-service id successfully updated/i)
      break
    default:
      break
  }
}

/** Opens the collaborator modal and adds the collaborators, then closes it.
 * @param {Page} page Playwright page
 * @param {E2eSettingsOptions} formSettings the form settings to update
 */
const addCollaborators = async (
  page: Page,
  formSettings: E2eSettingsOptions,
): Promise<void> => {
  if (formSettings.collaborators.length === 0) return

  await page.getByRole('button', { name: 'Manage collaborators' }).click()

  for (const collaborator of formSettings.collaborators) {
    await page.locator('button[name="email"]').fill(collaborator.email)

    if (!collaborator.write) {
      const dropdown = page.locator('button[name="Editor"]')
      const menuId = await dropdown.getAttribute('aria-controls')
      await dropdown.click()
      const menu = page.locator(`id=${menuId}`)
      await menu.getByText('Viewer').click()
    }

    await page.locator('button[name="Add collaborator"').click()

    // Check toast
    await expectToast(
      page,
      RegExp(`${collaborator.email} has been added as a Editor`, 'i'),
    )
  }

  await page.getByRole('button', { name: 'Close' }).click()
}

const addAdminEmails = async (
  page: Page,
  formSettings: E2eSettingsOptions,
): Promise<void> => {
  await page.getByRole('tab', { name: 'Email notifications' }).click()

  // Ensure that we are on the email notifications page
  await expect(
    page.getByRole('heading', { name: 'Email notifications' }),
  ).toBeVisible()

  if (formSettings.emails) {
    const emailInput = page.getByLabel('Notifications for new responses')
    await emailInput.focus()

    // Clear the current admin email
    await page.keyboard.press('Backspace')

    await emailInput.fill(formSettings.emails.join(', '))

    await page.keyboard.press('Tab')

    await expectToast(page, /emails successfully updated/i)
  }
}
const addFieldsAndLogic = async (
  page: Page,
  {
    formId,
    formFields,
    formLogics,
  }: { formId: string; formFields: E2eFieldMetadata[]; formLogics: E2eLogic[] },
) => {
  await page.getByText('Create').click()
  await expect(page).toHaveURL(ADMIN_FORM_PAGE_CREATE(formId))

  await addFields(page, formFields)
  await addLogics(page, formFields, formLogics)
}

/** Adds all prescribed fields to the form.
 * Precondition: is already on the Create page.
 * @param {Page} page Playwright page
 * @param {E2eFieldMetadata[]} formFields the form fields to create
 */
const addFields = async (
  page: Page,
  formFields: E2eFieldMetadata[],
): Promise<void> => {
  // Navigate to the fields tab.
  await page.getByRole('button', { name: 'Add fields' }).click()

  for (const field of formFields) {
    const myInfoAttr = getMyInfoAttribute(field)

    myInfoAttr
      ? await addMyInfoField(page, field, myInfoAttr)
      : await addBasicField(page, field)

    await page.getByRole('button', { name: 'Create field' }).click()
    await expectToast(page, /the .* was created/i)
  }

  await page.reload()
}

/** Adds all prescribed basic fields to the form.
 * Precondition: page must be currently on the admin builder page for the form.
 * @param {Page} page Playwright page
 * @param {E2eFieldMetadata} field the form field to create
 */
const addBasicField = async (
  page: Page,
  field: E2eFieldMetadata,
): Promise<void> => {
  await page.getByRole('tab', { name: 'Basic' }).click()

  const label = BASICFIELD_TO_DRAWER_META[field.fieldType].label
  const isNonInput = NON_INPUT_FIELD_TYPES.includes(field.fieldType)

  // Get button with exact fieldtype label text
  await page.getByRole('button', { name: label, exact: true }).click()

  // Enter title for input fields and Section
  if (isNonInput) {
    if (field.fieldType === BasicField.Section) {
      await page.getByLabel('Section heading').fill(field.title)
    }
    // Images and Statements don't have titles
  } else {
    await page.getByLabel('Question').fill(field.title)
  }

  // Toggle required for input fields except Table field (required toggled for individual columns)
  if (
    !isNonInput &&
    field.fieldType !== BasicField.Table &&
    field.required === false
  ) {
    await page.getByText('Required').click()
  }

  // Enter field description.
  if (field.description) {
    if (field.fieldType === BasicField.Statement) {
      await page.getByLabel('Paragraph').fill(field.description)
    } else {
      await page.getByLabel('Description').fill(field.description)
    }
  }

  // Handle the rest of the individual fields.
  switch (field.fieldType) {
    case BasicField.Attachment:
      await fillDropdown(
        page,
        page.getByRole('combobox', {
          name: 'Maximum size of individual attachment',
        }),
        `${field.attachmentSize} MB`,
      )
      break
    case BasicField.Checkbox:
      if (field.validateByValue) {
        await page.getByLabel('Selection limits').click()
        if (field.ValidationOptions.customMin) {
          await page
            .getByPlaceholder('Minimum')
            .nth(1)
            .fill(field.ValidationOptions.customMin.toString())
        }
        if (field.ValidationOptions.customMax) {
          await page
            .getByPlaceholder('Maximimum')
            .nth(1)
            .fill(field.ValidationOptions.customMax.toString())
        }
      }
    // Fall through to set "Others" and "Options".
    case BasicField.Radio:
      if (field.othersRadioButton) {
        await page.getByText('Others').first().click()
      }
    // Fall through to set "Options".
    case BasicField.Dropdown:
      await page
        .getByLabel('Options')
        .first()
        .fill(field.fieldOptions.join('\n'))
      break
    case BasicField.Date:
      {
        if (!field.dateValidation.selectedDateValidation) break
        await page.getByRole('combobox').first().click()
        await page
          .getByText(field.dateValidation.selectedDateValidation)
          .click()
        if (
          field.dateValidation.selectedDateValidation ===
          DateSelectedValidation.Custom
        ) {
          if (field.dateValidation.customMinDate) {
            await page
              .locator('[name="dateValidation.customMinDate"]')
              .fill(format(field.dateValidation.customMinDate, 'dd/MM/yyyy'))
          }
          if (field.dateValidation.customMaxDate) {
            await page
              .locator('[name="dateValidation.customMaxDate"]')
              .fill(format(field.dateValidation.customMaxDate, 'dd/MM/yyyy'))
          }
        }
      }
      break
    case BasicField.Decimal:
      if (field.validateByValue) {
        await page.getByText('Number validation').click()
        if (field.ValidationOptions.customMin) {
          await page
            .getByPlaceholder('Minimum value')
            .nth(1)
            .fill(field.ValidationOptions.customMin.toString())
        }
        if (field.ValidationOptions.customMax) {
          await page
            .getByPlaceholder('Maximum value')
            .nth(1)
            .fill(field.ValidationOptions.customMax.toString())
        }
      }
      break
    case BasicField.Email:
      if (field.isVerifiable) {
        await page.locator('label:has-text("OTP verification")').click()
        if (field.hasAllowedEmailDomains) {
          await page.getByText('Restrict email domains').click()
          await page
            .getByLabel('Domains allowed')
            .fill(field.allowedEmailDomains.join('\n'))
        }
      }
      if (field.autoReplyOptions.hasAutoReply) {
        await page.getByText('Email confirmation').click()
        await page
          .getByLabel('Subject')
          .fill(field.autoReplyOptions.autoReplySubject)
        await page
          .getByLabel('Sender name')
          .fill(field.autoReplyOptions.autoReplySender)
        await page
          .getByLabel('Content')
          .fill(field.autoReplyOptions.autoReplyMessage)
        // TODO: Print to pdf doesn't work.
        // if (field.autoReplyOptions.includeFormSummary) {
        //   await page.getByText('Include PDF response').click()
        // }
      }
      break
    case BasicField.Image:
      await page.setInputFiles('input[type="file"]', field.path)
      break
    case BasicField.LongText:
    case BasicField.ShortText:
      if (field.ValidationOptions.selectedValidation) {
        // Select from dropdown
        await page
          .locator(`[id="ValidationOptions.selectedValidation"]`)
          .fill(field.ValidationOptions.selectedValidation)
        await page
          .getByRole('option', {
            name: field.ValidationOptions.selectedValidation,
          })
          .click()
        if (field.ValidationOptions.customVal) {
          await page
            .getByPlaceholder('Number of characters')
            .nth(1)
            .fill(field.ValidationOptions.customVal.toString())
        }
      }
      break
    case BasicField.Mobile:
      if (field.allowIntlNumbers) {
        await page.getByText('Allow international numbers').click()
      }
      break
    case BasicField.Number:
      if (field.ValidationOptions.selectedValidation) {
        // We need to transform the backend values to frontend input values
        const selectedValidationInput =
          field.ValidationOptions.selectedValidation ===
          NumberSelectedValidation.Length
            ? 'Number of characters allowed'
            : 'Range of values allowed'

        await fillDropdown(
          page,
          page.getByRole('combobox', { name: 'Field restriction' }),
          selectedValidationInput,
        )

        if (
          field.ValidationOptions.selectedValidation ===
            NumberSelectedValidation.Length &&
          field.ValidationOptions.LengthValidationOptions
            .selectedLengthValidation
        ) {
          await fillDropdown(
            page,
            page.getByPlaceholder('Length restriction'),
            field.ValidationOptions.LengthValidationOptions
              .selectedLengthValidation,
          )

          if (field.ValidationOptions.LengthValidationOptions.customVal) {
            await page
              .getByPlaceholder('Number of characters')
              .nth(1)
              .fill(
                field.ValidationOptions.LengthValidationOptions.customVal.toString(),
              )
          }
        }

        if (
          field.ValidationOptions.selectedValidation ===
          NumberSelectedValidation.Range
        ) {
          const customMin =
            field.ValidationOptions.RangeValidationOptions.customMin?.toString() ??
            ('' as const)
          const customMax =
            field.ValidationOptions.RangeValidationOptions.customMax?.toString() ??
            ('' as const)

          await page.getByPlaceholder('Minimum value').nth(1).fill(customMin)
          await page.getByPlaceholder('Maximum value').nth(1).fill(customMax)
        }
      }
      break
    case BasicField.Rating:
      await fillDropdown(
        page,
        page.getByRole('combobox', { name: 'Number of steps' }),
        String(field.ratingOptions.steps),
      )
      await fillDropdown(
        page,
        page.getByRole('combobox', { name: 'Shape' }),
        field.ratingOptions.shape,
      )
      break
    case BasicField.Table:
      await page.getByLabel('Minimum rows').fill(String(field.minimumRows))
      if (field.addMoreRows) {
        await page.getByText('Allow respondent to add more rows').click()
        if (field.maximumRows) {
          await page
            .getByLabel('Maximum rows allowed')
            .fill(String(field.maximumRows))
        }
      }
      // First table option
      for (let i = 0; i < field.columns.length; i++) {
        const col = field.columns[i]
        if (i !== 0) {
          await page.getByRole('button', { name: 'Add column' }).click()
        }
        await page.getByLabel(`Column ${i + 1}`).fill(col.title)
        await page.getByLabel('Column type').nth(i).click()
        await page
          .getByRole('option', {
            name: BASICFIELD_TO_DRAWER_META[col.columnType].label,
          })
          .click()
        if (!col.required) {
          await page.getByText('Required').nth(i).click()
        }
        if (col.columnType === BasicField.Dropdown) {
          await page
            .locator(`[id="columns\\.${i}\\.fieldOptions"]`)
            .fill(col.fieldOptions.join('\n'))
        }
      }
      break
  }
}

/** Adds all prescribed MyInfo fields to the form.
 * Precondition: page must be currently on the admin builder page for the form.
 * @param {Page} page Playwright page
 * @param {E2eFieldMetadata} field the form field to create
 * @param {MyInfoAttribute} attr the MyInfo attribute to be added
 */
const addMyInfoField = async (
  page: Page,
  field: E2eFieldMetadata,
  attr: MyInfoAttribute,
): Promise<void> => {
  const label = MYINFO_FIELD_TO_DRAWER_META[attr].label

  await page.getByRole('tab', { name: 'MyInfo' }).click()
  await page.getByRole('button', { name: label, exact: true }).click()
}

/** Goes to settings page and adds settings, and toggle form to be open.
 * Precondition: is already on the Create page.
 * @param {Page} page Playwright page
 * @param {E2eFieldMetadata[]} formFields the form fields used to create the form
 * @param {E2eLogic[]} formLogics the form logic to create
 */
const addLogics = async (
  page: Page,
  formFields: E2eFieldMetadata[],
  formLogics: E2eLogic[],
) => {
  if (formLogics.length === 0) return

  // Navigate to the logic tab.
  await page.getByRole('button', { name: 'Add logic' }).click()

  for (const logic of formLogics) {
    // The 0th button called 'Add logic' is the sidebar tab nav button
    await page.getByRole('button', { name: 'Add logic' }).nth(1).click()

    // Add logic conditions
    for (let i = 0; i < logic.conditions.length; i++) {
      const { field, state, value } = logic.conditions[i]

      if (i > 0) {
        await page.getByRole('button', { name: 'Add condition' }).click()
      }

      await fillDropdown(
        page,
        page.locator(`id=conditions.${i}.field`),
        getTitleWithQuestionNumber(formFields, field),
      )
      await fillDropdown(
        page,
        page.locator(`id=conditions.${i}.state`),
        // Frontend removes leading 'is' from the condition name for rendering, so replicate that behavior.
        state.replace(/^is\s/i, ''),
      )
      const valueInput = page.locator(`id=conditions.${i}.value`)
      switch (state) {
        case LogicConditionState.Either:
          await fillMultiDropdown(
            page,
            page.getByRole('group').filter({ has: valueInput }),
            value,
          )
          break
        default:
          switch (formFields[field].fieldType) {
            case BasicField.Dropdown:
            case BasicField.Radio:
            case BasicField.Rating:
            case BasicField.YesNo:
              await fillDropdown(page, valueInput, value)
              break
            default:
              await valueInput.fill(value)
              break
          }
          break
      }
    }

    const logicTypeInput = page.locator('id=logicType')
    switch (logic.logicType) {
      case LogicType.ShowFields:
        await fillDropdown(page, logicTypeInput, 'Show field(s)')
        await fillMultiDropdown(
          page,
          page
            .getByRole('group')
            .filter({ has: page.getByLabel('Show').first() }),
          logic.show.map((n) => getTitleWithQuestionNumber(formFields, n)),
        )
        break
      case LogicType.PreventSubmit:
        await fillDropdown(page, logicTypeInput, 'Disable submission')
        await page.locator('id=preventSubmitMessage').fill(logic.message)
        break
    }

    // Save
    await page.getByText('Add logic').click()
  }

  await page.reload()
}

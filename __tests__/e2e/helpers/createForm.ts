import { Page } from '@playwright/test'
import cuid from 'cuid'
import { format } from 'date-fns'
import { BASICFIELD_TO_DRAWER_META } from 'frontend/src/features/admin-form/create/constants'
import {
  BasicField,
  DateSelectedValidation,
  FormAuthType,
  FormStatus,
  LogicConditionState,
  LogicType,
} from 'shared/types'

import { IFormModel, IFormSchema } from 'src/types'

import {
  ADMIN_FORM_PAGE_PREFIX,
  DASHBOARD_PAGE,
  E2eFieldMetadata,
  E2eForm,
  E2eLogic,
  E2eSettingsOptions,
  NON_INPUT_FIELD_TYPES,
} from '../constants'
import { expect } from '../fixtures/auth'
import {
  expectToast,
  fillDropdown,
  fillMultiDropdown,
  getTitleWithQuestionNumber,
} from '../utils'

/**
 * Navigates to the dashboard and creates a new form with all the associated form settings.
 * @param {Page} page Playwright page
 * @returns {IFormSchema} the created form
 */
export const createForm = async (
  page: Page,
  Form: IFormModel,
  { formFields, formLogics, formSettings }: E2eForm,
): Promise<IFormSchema> => {
  const formId = await addForm(page)
  await addFields(page, formFields)
  await addLogics(page, { formFields, formLogics })
  await addSettings(page, { formId, formSettings })

  const form = await Form.findById(formId)

  if (!form) throw Error('Form not found in db')

  return form
}

/**
 * Navigates to the dashboard and creates a new form. Ends on the admin builder page.
 * @param {Page} page Playwright page
 * @returns {string} the created form id
 */
const addForm = async (page: Page): Promise<string> => {
  await page.goto(DASHBOARD_PAGE)

  // Press escape 5 times to get rid of any banners
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Create form' }).click()

  await page.getByLabel('Form name').fill(`e2e-test-${cuid()}`)

  await page.getByText('Email Mode').click()
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(page).toHaveURL(new RegExp(`${ADMIN_FORM_PAGE_PREFIX}/.*`, 'i'))

  const l = ADMIN_FORM_PAGE_PREFIX.length + 1
  const formId = page
    .url()
    .match(new RegExp(`${ADMIN_FORM_PAGE_PREFIX}/[a-fA-F0-9]{24}`))?.[0]
    .slice(l, l + 24)

  expect(formId).toBeTruthy()

  // Clear any banners
  await page.getByRole('button', { name: 'Next' }).press('Escape')

  return formId!
}

/** Adds all prescribed fields to the form.
 * Precondition: page must be currently on the admin builder page for the form.
 * @param {Page} page Playwright page
 * @param {E2eFieldMetadata[]} formFields the form fields to create
 */
const addFields = async (
  page: Page,
  formFields: E2eFieldMetadata[],
): Promise<void> => {
  await expect(page).toHaveURL(new RegExp(`${ADMIN_FORM_PAGE_PREFIX}/.*`, 'i'))

  await page.getByRole('button', { name: 'Add fields' }).click()

  for (const field of formFields) {
    const label = BASICFIELD_TO_DRAWER_META[field.fieldType].label
    const isNonInput = NON_INPUT_FIELD_TYPES.includes(field.fieldType)

    // Get button with exact fieldtype label text
    await page.getByRole('button').locator(`text="${label}"`).click()

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
          page.getByRole('textbox', {
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
        await page.getByLabel('Options').fill(field.fieldOptions.join('\n'))
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
          if (field.autoReplyOptions.includeFormSummary) {
            await page.getByText('Include PDF response').click()
          }
        }
        break
      case BasicField.Image:
        await page.setInputFiles('input[type="file"]', field.path)
        break
      case BasicField.LongText:
      case BasicField.Number:
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
      case BasicField.Rating:
        await fillDropdown(
          page,
          page.getByRole('textbox', { name: 'Number of steps' }),
          String(field.ratingOptions.steps),
        )
        await fillDropdown(
          page,
          page.getByRole('textbox', { name: 'Shape' }),
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

    await page.getByRole('button', { name: 'Create field' }).click()
    await expectToast(page, /the .* was created/i)
  }

  await page.reload()
}

/** Goes to settings page and adds settings, and toggle form to be open.
 * Precondition: must be on the admin builder page with no dirty fields.
 * @param {Page} page Playwright page
 * @param {E2eFieldMetadata[]} formFields the form fields used to create the form
 * @param {E2eLogic[]} formLogics the form logic to create
 */
const addLogics = async (
  page: Page,
  {
    formFields,
    formLogics,
  }: { formFields: E2eFieldMetadata[]; formLogics: E2eLogic[] },
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

      if (i) await page.getByRole('button', { name: 'Add condition' }).click()

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
          await fillMultiDropdown(page, valueInput, value)
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
          page.locator('id=show'),
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

    // Check toast
    await expectToast(page, /the logic was successfully created/i)
  }

  await page.reload()
}

/** Goes to settings page and adds settings, and toggle form to be open.
 * Precondition: must be on the admin builder page with no dirty fields.
 * @param {Page} page Playwright page
 * @param {string} formId the formId
 * @param {E2eSettingsOptions} formSettings the form settings to update
 */
const addSettings = async (
  page: Page,
  {
    formId,
    formSettings,
  }: { formId: string; formSettings: E2eSettingsOptions },
): Promise<void> => {
  // Check precondition
  await expect(page).toHaveURL(`${ADMIN_FORM_PAGE_PREFIX}/${formId}`)

  await page.getByText('Settings').click()
  await expect(page).toHaveURL(`${ADMIN_FORM_PAGE_PREFIX}/${formId}/settings`)

  await addGeneralSettings(page, formSettings)
  await addAuthSettings(page, formSettings)
  await addCollaborators(page, formSettings)

  // Open the form as the last thing to do!
  if (formSettings.status === FormStatus.Public) {
    // Go back to general settings, to open the form if necessary!
    await page.getByRole('tab', { name: 'General' }).click()

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

    // Check toast
    await expect(page.getByText(/your form is now open/i)).toBeVisible()

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

  if (formSettings.emails) {
    const emailInput = page.getByLabel('Emails where responses will be sent')
    await emailInput.focus()

    // Clear the current admin email
    await page.keyboard.press('Backspace')

    await emailInput.fill(formSettings.emails.join(', '))

    await expectToast(page, /emails successfully updated/i)
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
  await expect(
    page.getByRole('heading', { name: 'Enable Singpass authentication' }),
  ).toBeVisible()

  const name = `Singpass${
    formSettings.authType === FormAuthType.SP
      ? ''
      : formSettings.authType === FormAuthType.SGID
      ? ' App-only Login (Free)'
      : formSettings.authType === FormAuthType.MyInfo
      ? ' with MyInfo'
      : ' (Corporate)'
  }`

  await page
    .locator('label', { has: page.getByRole('radio', { name }) })
    .click()

  await expectToast(page, /form authentication successfully updated/i)

  if (formSettings.esrvcId) {
    switch (formSettings.authType) {
      case FormAuthType.SP:
      case FormAuthType.CP:
      case FormAuthType.MyInfo:
        await page.locator(`id=esrvcId`).fill(formSettings.esrvcId)
        await page.keyboard.press('Enter')
        await expectToast(page, /e-service id successfully updated/i)
        break
      default:
        break
    }
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

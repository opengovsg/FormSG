'use strict'

require('./polyfills')

const Sentry = require('@sentry/browser')
const { Angular: AngularIntegration } = require('@sentry/integrations')

// Define module dependencies (without ngSentry)
const moduleDependencies = [
  'ui.select',
  'ngAnimate',
  'ngSanitize',
  'ngResource',
  'ui.router',
  'ui.bootstrap',
  'vcRecaptcha',
  'users',
  'ngFileUpload',
  'ng-sortable',
  'ngclipboard',
  'ngCookies',
  'core',
  'ngTable',
  'infinite-scroll',
  'ngIntlTelInput',
  'ngAria',
  'ngMessages',
  'daterangepicker',
  'pascalprecht.translate',
]
// NPM Libs
window.jQuery = require('jquery/dist/jquery')
window.$ = window.jQuery
const angular = require('angular')

// Sentry.io SDK
// Docs: https://docs.sentry.io/platforms/javascript/guides/angular/angular1/
if (window.sentryConfigUrl) {
  Sentry.init({
    dsn: window.sentryConfigUrl,
    integrations: [new AngularIntegration()],
  })
  moduleDependencies.push('ngSentry')
}

require('angular-translate')
require('angular-translate-loader-partial')

require('angular-aria')
require('angular-animate')
require('angular-cookies')
require('angular-drag-scroll/src/ng-drag-scroll')
require('angular-permission/dist/angular-permission')
require('@opengovsg/angular-recaptcha-fallback')
require('angular-resource')
require('angular-sanitize')
require('angular-messages')

require('angular-ui-bootstrap')
require('angular-ui-router')

require('@opengovsg/angular-legacy-sortablejs-maintained')

require('ui-select')

require('@opengovsg/ng-file-upload')

require('ngclipboard')

require('ng-table/bundles/ng-table.min')

require('slick-carousel')
require('ng-infinite-scroll')

// For mobile number field
require('intl-tel-input/build/js/utils.js')
require('intl-tel-input/build/js/intlTelInput.js')

// For daterangepicker
require('@opengovsg/angular-daterangepicker-webpack')

const appName = 'FormSG'
// Add module dependencies
const app = angular.module(appName, moduleDependencies)

// Setting HTML5 Location Mode
angular.module(appName).config([
  '$locationProvider',
  function ($locationProvider) {
    $locationProvider.hashPrefix('!')
  },
])

angular.module(appName).config([
  '$translateProvider',
  '$translatePartialLoaderProvider',
  // eslint-disable-next-line no-unused-vars
  function ($translateProvider, $translatePartialLoaderProvider) {
    $translateProvider
      .useLoader('$translatePartialLoader', {
        urlTemplate: 'public/translations/{lang}/{part}.json',
      })
      .preferredLanguage('en-SG')
      .fallbackLanguage('en-SG')

    $translateProvider.useSanitizeValueStrategy('sanitize')
  },
])

// Disable ngAria automatically injecting tabindex=0
angular.module(appName).config([
  '$ariaProvider',
  function ($ariaProvider) {
    $ariaProvider.config({ tabindex: false })
  },
])

// Declare AngularJS modules
angular.module('core', [])
angular.module('forms', [])
angular.module('users', [])
angular.module('ngIntlTelInput', [])

app.requires.push('core')
app.requires.push('forms')
app.requires.push('users')
app.requires.push('ngIntlTelInput')

/**
 * Core module
 */

// Core services
require('./modules/core/services/gtag.client.service.js')

// Core controllers
require('./modules/core/controllers/landing.client.controller.js')
require('./modules/core/controllers/edit-contact-number-modal.client.controller')

// Core directives
require('./modules/core/directives/on-click-outside.client.directive')
require('./modules/core/directives/route-loading-indicator.client.directive.js')

// Core config
require('./modules/core/config/core.client.routes.js')

// Core components
require('./modules/core/components/navbar.client.component.js')
require('./modules/core/components/avatar-dropdown.client.component')
require('./modules/core/components/banner.client.component.js')
require('./modules/core/components/sg-govt-banner.client.component.js')
require('./modules/core/components/footer.client.component.js')
require('./modules/core/components/toolset-dropdown.client.component.js')

/**
 * Forms module
 */
// forms admin controllers
require('./modules/forms/admin/controllers/admin-form.client.controller.js')
require('./modules/forms/admin/controllers/list-forms.client.controller.js')
require('./modules/forms/admin/controllers/create-form-modal.client.controller.js')
require('./modules/forms/admin/controllers/activate-form-modal.client.controller.js')
require('./modules/forms/admin/controllers/results-panel.client.controller.js')
require('./modules/forms/admin/controllers/view-responses.client.controller.js')
require('./modules/forms/admin/controllers/mobile-edit-fields-modal.client.controller.js')
require('./modules/forms/admin/controllers/edit-fields-modal.client.controller.js')
require('./modules/forms/admin/controllers/edit-end-page-modal.client.controller.js')
require('./modules/forms/admin/controllers/edit-start-page-modal.client.controller.js')
require('./modules/forms/admin/controllers/edit-myinfo-field-modal.client.controller.js')
require('./modules/forms/admin/controllers/delete-field-warning-modal.client.controller.js')
require('./modules/forms/admin/controllers/delete-form-modal.client.controller.js')
require('./modules/forms/admin/controllers/edit-logic-modal.client.controller.js')
require('./modules/forms/admin/controllers/pop-up-modal.client.controller.js')

// forms admin directives
require('./modules/forms/admin/directives/settings-form.client.directive.js')
require('./modules/forms/admin/directives/validate-form-emails-input.directive.js')
require('./modules/forms/admin/directives/edit-form.client.directive.js')
require('./modules/forms/admin/directives/is-verifiable-save-interceptor.directive.js')
require('./modules/forms/admin/directives/validate-email-domain-from-text.directive.js')
require('./modules/forms/admin/directives/view-feedback.client.directive.js')
require('./modules/forms/admin/directives/configure-form.client.directive.js')
require('./modules/forms/admin/directives/configure-mobile.client.directive.js')
require('./modules/forms/admin/directives/verify-secret-key.client.directive.js')
require('./modules/forms/admin/directives/daterangepicker.client.directive.js')
require('./modules/forms/admin/directives/edit-captcha.client.directive.js')
require('./modules/forms/admin/controllers/create-form-template-modal.client.controller.js')
require('./modules/forms/admin/controllers/collaborator-modal.client.controller.js')

// forms admin components
require('./modules/forms/admin/components/share-form.client.component.js')
require('./modules/forms/admin/components/edit-logic.client.component.js')
require('./modules/forms/admin/components/export-button.client.component.js')
require('./modules/forms/admin/components/form-title-input.client.component.js')
require('./modules/forms/admin/components/form-emails-input.client.component.js')

// response components
require('./modules/forms/admin/components/response-components/response.client.component.js')
require('./modules/forms/admin/components/response-components/response-title.client.component.js')
require('./modules/forms/admin/components/response-components/response-answer.client.component.js')
require('./modules/forms/admin/components/response-components/response-answer-array.client.component.js')
require('./modules/forms/admin/components/response-components/response-attachment.client.component.js')
require('./modules/forms/admin/components/response-components/response-table.client.component.js')

// forms base controllers
require('./modules/forms/base/controllers/submit-form.client.controller.js')
require('./modules/forms/base/controllers/error-page.client.controller.js')

// forms base components
require('./modules/forms/base/components/field.error.component.js')
require('./modules/forms/base/components/end-page.client.component.js')
require('./modules/forms/base/components/field-icon.client.component.js')
require('./modules/forms/base/components/feedback-form.client.component.js')
require('./modules/forms/base/components/start-page.client.component.js')
require('./modules/forms/base/components/verifiable-field.client.component.js')
require('./modules/forms/base/components/field-dropdown.client.component.js')
require('./modules/forms/base/components/field-attachment.client.component.js')
require('./modules/forms/base/components/field-decimal.client.component.js')
require('./modules/forms/base/components/field-textfield.client.component.js')
require('./modules/forms/base/components/field-email.client.component.js')
require('./modules/forms/base/components/field-date.client.component.js')
require('./modules/forms/base/components/field-yes-no.client.component.js')
require('./modules/forms/base/components/field-radiobutton.client.component.js')
require('./modules/forms/base/components/field-checkbox.client.component.js')
require('./modules/forms/base/components/field-table.client.component.js')
require('./modules/forms/base/components/field-image.client.component.js')
require('./modules/forms/base/components/field-mobile.client.component.js')
require('./modules/forms/base/components/field-homeno.client.component.js')
require('./modules/forms/base/components/field-nric.client.component.js')
require('./modules/forms/base/components/field-number.client.component.js')
require('./modules/forms/base/components/field-rating.client.component.js')
require('./modules/forms/base/components/field-section.client.component.js')
require('./modules/forms/base/components/field-statement.client.component.js')
require('./modules/forms/base/components/field-uen.client.component.js')
require('./modules/forms/base/components/field-textarea.client.component.js')

// forms base directives
require('./modules/forms/base/directives/field.client.directive.js')
require('./modules/forms/base/directives/iframe-onload.client.directive.js')
require('./modules/forms/base/directives/rating-stars.client.directive.js')
require('./modules/forms/base/directives/validate-checkbox.client.directive.js')
require('./modules/forms/base/directives/validate-email-domain.client.directive.js')
require('./modules/forms/base/directives/validate-email-format.client.directive.js')
require('./modules/forms/base/directives/validate-nric.client.directive.js')
require('./modules/forms/base/directives/validate-uen.client.directive.js')
require('./modules/forms/base/directives/validate-url.client.directive.js')
require('./modules/forms/base/directives/ng-intl-tel-input.js')
require('./modules/forms/base/directives/submit-form.directive.js')

// forms config
require('./modules/forms/config/forms.client.config.js')
require('./modules/forms/config/forms.client.routes.js')

// forms services
require('./modules/forms/services/form-fields.client.service.js')
require('./modules/forms/services/form-api.client.factory.js')
require('./modules/forms/services/form-error.client.factory.js')
require('./modules/forms/services/spcp-session.client.factory.js')
require('./modules/forms/services/submissions.client.factory.js')
require('./modules/forms/services/toastr.client.factory.js')
require('./modules/forms/services/attachment.client.service.js')
require('./modules/forms/services/captcha.client.service.js')
require('./modules/forms/services/mailto.client.factory.js')

/**
 * Users module
 */

// User configuration
require('./modules/users/config/users.client.config.js')
require('./modules/users/config/users.client.routes.js')

// User controllers
require('./modules/users/controllers/authentication.client.controller.js')
require('./modules/users/controllers/billing.client.controller.js')
require('./modules/users/controllers/examples-list.client.controller.js')

// User directives
require('./modules/users/controllers/examples-card.client.directive.js')

// Configuration for mobile phone numbers
angular.module(appName).config([
  'ngIntlTelInputProvider',
  function (ngIntlTelInputProvider) {
    ngIntlTelInputProvider.set({
      initialCountry: 'sg',
      preferredCountries: ['sg'],
    })
  },
])

/**
 * Initialise the AngularJS app.
 * @param  {[Object]} $templateCache
 */
app.run([
  '$templateCache',
  '$state',
  '$translate',
  '$translatePartialLoader',
  function ($templateCache, $state, $translate, $translatePartialLoader) {
    // Init main translation file for links throughout the application.
    $translatePartialLoader.addPart('main')
    $translate.refresh()

    // Use AngularJS $templateCache service to cache all forms
    // Core
    $templateCache.put(
      'modules/core/componentViews/navbar.html',
      require('./modules/core/componentViews/navbar.html'),
    )

    $templateCache.put(
      'modules/core/componentViews/avatar-dropdown.html',
      require('./modules/core/componentViews/avatar-dropdown.html'),
    )

    $templateCache.put(
      'modules/core/componentViews/banner.html',
      require('./modules/core/componentViews/banner.html'),
    )
    $templateCache.put(
      'modules/core/componentViews/sg-govt-banner.html',
      require('./modules/core/componentViews/sg-govt-banner.html'),
    )
    $templateCache.put(
      'modules/core/componentViews/footer.html',
      require('./modules/core/componentViews/footer.html'),
    )
    $templateCache.put(
      'modules/core/componentViews/toolset-dropdown.html',
      require('./modules/core/componentViews/toolset-dropdown.html'),
    )

    // Core views
    $templateCache.put(
      'modules/core/views/landing.client.view.html',
      require('./modules/core/views/landing.client.view.html'),
    )

    $templateCache.put(
      'modules/core/views/edit-contact-number-modal.view.html',
      require('./modules/core/views/edit-contact-number-modal.view.html'),
    )

    // Forms module

    // Forms admin componentViews
    $templateCache.put(
      'modules/forms/admin/componentViews/share-form.client.view.html',
      require('./modules/forms/admin/componentViews/share-form.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/componentViews/edit-logic.client.view.html',
      require('./modules/forms/admin/componentViews/edit-logic.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/componentViews/export-button.client.view.html',
      require('./modules/forms/admin/componentViews/export-button.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/componentViews/form-title-input.client.view.html',
      require('./modules/forms/admin/componentViews/form-title-input.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/componentViews/form-emails-input.client.view.html',
      require('./modules/forms/admin/componentViews/form-emails-input.client.view.html'),
    )

    // Response component views
    $templateCache.put(
      'modules/forms/admin/componentViews/response-views/response.client.view.html',
      require('./modules/forms/admin/componentViews/response-views/response.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/componentViews/response-views/response-title.client.view.html',
      require('./modules/forms/admin/componentViews/response-views/response-title.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/componentViews/response-views/response-table.client.view.html',
      require('./modules/forms/admin/componentViews/response-views/response-table.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/componentViews/response-views/response-attachment.client.view.html',
      require('./modules/forms/admin/componentViews/response-views/response-attachment.client.view.html'),
    )

    // Forms admin directiveViews
    $templateCache.put(
      'modules/forms/admin/directiveViews/settings-form.client.view.html',
      require('./modules/forms/admin/directiveViews/settings-form.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/directiveViews/edit-form.client.view.html',
      require('./modules/forms/admin/directiveViews/edit-form.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/directiveViews/view-feedback.client.view.html',
      require('./modules/forms/admin/directiveViews/view-feedback.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/directiveViews/configure-form.client.view.html',
      require('./modules/forms/admin/directiveViews/configure-form.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/directiveViews/configure-mobile.client.view.html',
      require('./modules/forms/admin/directiveViews/configure-mobile.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/directiveViews/verify-secret-key.client.view.html',
      require('./modules/forms/admin/directiveViews/verify-secret-key.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/directiveViews/verify-secret-key-activation.client.view.html',
      require('./modules/forms/admin/directiveViews/verify-secret-key-activation.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/directiveViews/daterangepicker.client.view.html',
      require('./modules/forms/admin/directiveViews/daterangepicker.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/directiveViews/edit-captcha.client.view.html',
      require('./modules/forms/admin/directiveViews/edit-captcha.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/directiveViews/submit-form.directive.view.html',
      require('./modules/forms/base/directiveViews/submit-form.directive.view.html'),
    )

    // Forms admin views
    $templateCache.put(
      'modules/forms/admin/views/view-responses.client.view.html',
      require('./modules/forms/admin/views/view-responses.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/admin-form.client.view.html',
      require('./modules/forms/admin/views/admin-form.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/edit-start-page.client.modal.html',
      require('./modules/forms/admin/views/edit-start-page.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/edit-end-page.client.modal.html',
      require('./modules/forms/admin/views/edit-end-page.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/edit-myinfo-field.client.modal.html',
      require('./modules/forms/admin/views/edit-myinfo-field.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/list-forms.client.view.html',
      require('./modules/forms/admin/views/list-forms.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/results-panel.client.view.html',
      require('./modules/forms/admin/views/results-panel.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/pop-up.client.modal.html',
      require('./modules/forms/admin/views/pop-up.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/create-form.client.modal.html',
      require('./modules/forms/admin/views/create-form.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/delete-form.client.modal.html',
      require('./modules/forms/admin/views/delete-form.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/mobile-edit-fields.client.modal.html',
      require('./modules/forms/admin/views/mobile-edit-fields.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/edit-fields.client.modal.html',
      require('./modules/forms/admin/views/edit-fields.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/delete-field-warning.client.modal.html',
      require('./modules/forms/admin/views/delete-field-warning.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/edit-logic.client.modal.html',
      require('./modules/forms/admin/views/edit-logic.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/activate-form.client.modal.html',
      require('./modules/forms/admin/views/activate-form.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/decrypt-progress.client.modal.html',
      require('./modules/forms/admin/views/decrypt-progress.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/download-all-attachments.client.modal.html',
      require('./modules/forms/admin/views/download-all-attachments.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/create-form-template.client.modal.html',
      require('./modules/forms/admin/views/create-form-template.client.modal.html'),
    )
    $templateCache.put(
      'modules/forms/admin/views/collaborator.client.modal.html',
      require('./modules/forms/admin/views/collaborator.client.modal.html'),
    )

    // Forms base componentViews
    $templateCache.put(
      'modules/forms/base/componentViews/fieldError.html',
      require('./modules/forms/base/componentViews/fieldError.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/feedback-form.client.view.html',
      require('./modules/forms/base/componentViews/feedback-form.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/end-page.html',
      require('./modules/forms/base/componentViews/end-page.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/start-page.html',
      require('./modules/forms/base/componentViews/start-page.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/verifiable-field.html',
      require('./modules/forms/base/componentViews/verifiable-field.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-dropdown.client.view.html',
      require('./modules/forms/base/componentViews/field-dropdown.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-attachment.client.view.html',
      require('./modules/forms/base/componentViews/field-attachment.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-decimal.client.view.html',
      require('./modules/forms/base/componentViews/field-decimal.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-textfield.client.view.html',
      require('./modules/forms/base/componentViews/field-textfield.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-email.client.view.html',
      require('./modules/forms/base/componentViews/field-email.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-date.client.view.html',
      require('./modules/forms/base/componentViews/field-date.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-yes-no.client.view.html',
      require('./modules/forms/base/componentViews/field-yes-no.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-radiobutton.client.view.html',
      require('./modules/forms/base/componentViews/field-radiobutton.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-checkbox.client.view.html',
      require('./modules/forms/base/componentViews/field-checkbox.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-table.client.view.html',
      require('./modules/forms/base/componentViews/field-table.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-image.client.view.html',
      require('./modules/forms/base/componentViews/field-image.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-mobile.client.view.html',
      require('./modules/forms/base/componentViews/field-mobile.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-homeno.client.view.html',
      require('./modules/forms/base/componentViews/field-homeno.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-nric.client.view.html',
      require('./modules/forms/base/componentViews/field-nric.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-number.client.view.html',
      require('./modules/forms/base/componentViews/field-number.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-rating.client.view.html',
      require('./modules/forms/base/componentViews/field-rating.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-section.client.view.html',
      require('./modules/forms/base/componentViews/field-section.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-statement.client.view.html',
      require('./modules/forms/base/componentViews/field-statement.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-textarea.client.view.html',
      require('./modules/forms/base/componentViews/field-textarea.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/componentViews/field-uen.client.view.html',
      require('./modules/forms/base/componentViews/field-uen.client.view.html'),
    )

    // Forms base directiveViews
    $templateCache.put(
      'modules/forms/base/directiveViews/datepicker.html',
      require('./modules/forms/base/directiveViews/datepicker.html'),
    )
    $templateCache.put(
      'modules/forms/base/directiveViews/datepicker-day.html',
      require('./modules/forms/base/directiveViews/datepicker-day.html'),
    )
    $templateCache.put(
      'modules/forms/base/directiveViews/datepicker-month.html',
      require('./modules/forms/base/directiveViews/datepicker-month.html'),
    )
    $templateCache.put(
      'modules/forms/base/directiveViews/datepicker-year.html',
      require('./modules/forms/base/directiveViews/datepicker-year.html'),
    )
    $templateCache.put(
      'modules/forms/base/directiveViews/datepicker-popup.html',
      require('./modules/forms/base/directiveViews/datepicker-popup.html'),
    )

    $templateCache.put(
      'modules/forms/base/directiveViews/input-stars.html',
      require('./modules/forms/base/directiveViews/input-stars.html'),
    )
    $templateCache.put(
      'modules/forms/base/directiveViews/field.client.directive.view.html',
      require('./modules/forms/base/directiveViews/field.client.directive.view.html'),
    )

    // Forms base views
    $templateCache.put(
      'modules/forms/base/views/submit-form.client.view.html',
      require('./modules/forms/base/views/submit-form.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/views/error-page.client.view.html',
      require('./modules/forms/base/views/error-page.client.view.html'),
    )
    $templateCache.put(
      'modules/forms/base/views/submit-progress.client.modal.html',
      require('./modules/forms/base/views/submit-progress.client.modal.html'),
    )

    // Users module

    // Users views
    $templateCache.put(
      'modules/users/views/authentication/signin.client.view.html',
      require('./modules/users/views/authentication/signin.client.view.html'),
    )
    $templateCache.put(
      'modules/users/views/static/terms.client.view.html',
      require('./modules/users/views/static/terms.client.view.html'),
    )
    $templateCache.put(
      'modules/users/views/static/privacy.client.view.html',
      require('./modules/users/views/static/privacy.client.view.html'),
    )
    $templateCache.put(
      'modules/users/views/billing.client.view.html',
      require('./modules/users/views/billing.client.view.html'),
    )
    $templateCache.put(
      'modules/users/views/examples.client.view.html',
      require('./modules/users/views/examples-list.client.view.html'),
    )
    $templateCache.put(
      'modules/users/views/examples-card.client.view.html',
      require('./modules/users/views/examples-card.client.view.html'),
    )

    // Use ui-router's $state service for transition error handling
    $state.defaultErrorHandler(function (error) {
      /*
        The type of the rejection.
        RejectType.SUPERSEDED (2)
        RejectType.ABORTED (3)
        RejectType.INVALID (4)
        RejectType.IGNORED (5)
        RejectType.ERROR (6)
      */
      // Swallow superseded transitions as we use $state.go('error') when forms cannot be resolved
      if (error.type !== 2) {
        console.error(error)
      }
    })
  },
])

// Prevent route navigation when a modal is open
app.run([
  '$rootScope',
  '$uibModalStack',
  function ($rootScope, $uibModalStack) {
    $rootScope.$on('$locationChangeStart', (event, newUrl, oldUrl) => {
      const splitPath = oldUrl.split(location.host)
      if (splitPath.length > 1 && splitPath[1] === '/#!/signin') {
        return
      }

      if ($uibModalStack.getTop()) {
        event.preventDefault()
      }
    })
  },
])

/* Constants */
angular
  .module('forms')
  .constant('emoji', {
    getUrlFromScore: (score) => {
      // Ensure index is from 0-4
      if (!score) {
        return null
      }
      let emojiIndex = Math.max(0, Math.round(score) - 1)
      emojiIndex = Math.min(emojiIndex, 4)
      let emojiFace = ['angry', 'sad', 'neutral', 'ok', 'happy'][emojiIndex]
      return `/public/modules/core/img/smileys/${emojiFace}.svg`
    },
  })
  .constant('responseModeEnum', { ENCRYPT: 'encrypt', EMAIL: 'email' })
  .constant('prefill', {
    QUERY_ID: 'queryId',
    STORED_QUERY: 'storedQuery',
  })

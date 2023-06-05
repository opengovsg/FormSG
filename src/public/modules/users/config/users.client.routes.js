'use strict'

// Setting up route
angular.module('users').config([
  '$stateProvider',
  function ($stateProvider) {
    // Users state routing
    $stateProvider
      .state('privacy', {
        url: '/privacy',
        templateUrl: 'modules/users/views/static/privacy.client.view.html',
      })
      .state('terms', {
        url: '/terms',
        templateUrl: 'modules/users/views/static/terms.client.view.html',
      })
      .state('signin', {
        url: '/signin',
        templateUrl:
          'modules/users/views/authentication/signin.client.view.html',
        controller: 'AuthenticationController',
        controllerAs: 'vm',
        params: {
          // After logging in, the user will be redirected to the targetState.
          // By default, redirect to list forms page on login.
          targetState: 'listForms',
          // If targetState is provided, use targetFormId to redirect users to the right form's page.
          // e.g. if targetState is 'use-template', redirect users to /:formId/use-template upon successful login.
          // By default, there will be no targetFormId.
          targetFormId: undefined,
        },
      })
      .state('examples', {
        url: '/examples',
        templateUrl: 'modules/users/views/examples.client.view.html',
        resolve: {
          // FormData will contain a specific form's information if the examplesController is supposed to pre-open that
          // form as a modal, as in the 'use-template' state.
          // By default, no specified template should be opened.
          FormData: () => undefined,
        },
        controller: 'ExamplesController',
        controllerAs: 'vm',
      })
      .state('billing', {
        url: '/billing',
        templateUrl: 'modules/users/views/billing.client.view.html',
        controller: 'BillingController',
        controllerAs: 'vm',
      })
  },
])

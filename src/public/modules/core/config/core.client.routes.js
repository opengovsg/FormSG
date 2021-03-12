'use strict'

angular.module('core').config([
  '$urlRouterProvider',
  '$stateProvider',
  function ($urlRouterProvider, $stateProvider) {
    // TODO: ui-router $urlRouterProvider is deprecated, use UrlRulesApi instead
    $urlRouterProvider
      // Ensure backward compatibility for links with /forms/:agency/?(preview|template|embed)
      .when('/forms/:agency/:formId/admin', '/:formId/admin')
      .when('/forms/:agency/:formId', '/:formId')
      .when('/forms/:agency/:formId/*state', '/:formId/*state')
      .when('/:formId/embed', '/:formId')
      .when('', '/')
      .otherwise('/error/404')
    $stateProvider.state('landing', {
      url: '/',
      templateUrl: 'modules/core/views/landing.client.view.html',
      controller: 'LandingPageController',
      controllerAs: 'vm',
      resolve: {
        AnalyticStats: [
          'Analytics',
          '$q',
          function (Analytics) {
            const formCountP = Analytics.getFormCount()
            const userCountP = Analytics.getUserCount()
            const submissionCountP = Analytics.getSubmissionCount()
            return Promise.all([formCountP, userCountP, submissionCountP]).then(
              ([formCount, userCount, submissionCount]) => {
                return { formCount, userCount, submissionCount }
              },
            )
          },
        ],
      },
    })
  },
])

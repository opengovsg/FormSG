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
          function (Analytics) {
            return Analytics.getStatistics()
          },
        ],
      },
    })
  },
])

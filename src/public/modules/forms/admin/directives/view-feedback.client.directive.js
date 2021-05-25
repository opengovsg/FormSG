'use strict'

const FormFeedback = require('../../../../services/FormFeedbackService')

angular
  .module('forms')
  .directive('viewFeedbackDirective', [
    '$timeout',
    '$q',
    'Submissions',
    'NgTableParams',
    'emoji',
    viewFeedbackDirective,
  ])

function viewFeedbackDirective(
  $timeout,
  $q,
  Submissions,
  NgTableParams,
  emoji,
) {
  return {
    templateUrl:
      'modules/forms/admin/directiveViews/view-feedback.client.view.html',
    restrict: 'E',
    scope: {
      myform: '<',
    },
    controller: [
      '$scope',
      function ($scope) {
        $scope.loading = true
        $scope.csvDownloading = false

        // Dummy data to return if no feedback exists
        let dummyData = [
          {
            index: 1,
            date: '24 Jun 2018',
            dateShort: '24 Jun',
            rating: 5,
            comment: 'Brilliantly designed form!',
          },
          {
            index: 2,
            date: '26 Jun 2018',
            dateShort: '26 Jun',
            rating: 5,
            comment: 'Very easy to fill in :)',
          },
          {
            index: 3,
            date: '28 Jun 2018',
            dateShort: '28 Jun',
            rating: 4,
            comment: 'No issues at all. Smooth form-filling experience',
          },
          {
            index: 4,
            date: '28 Jun 2018',
            dateShort: '28 Jun',
            rating: 4,
            comment: '',
          },
        ]
        // When this route is initialized, call the count function
        $scope.$parent.$watch('vm.activeResultsTab', (newValue) => {
          if (newValue === 'feedback' && $scope.loading) {
            Submissions.count({
              formId: $scope.myform._id,
            }).then(
              function (response) {
                $scope.createFeedbackTable(response)
              },
              function (error) {
                console.error(error)
              },
            )
          }
        })

        $scope.createFeedbackTable = function (submissionCount) {
          $q.when(FormFeedback.getFeedback($scope.myform._id)).then(
            function (response) {
              // Configure table
              $scope.tableParams = new NgTableParams(
                {
                  page: 1, // show first page
                  count: 10, // count per page
                  sorting: { index: 'desc' }, // modify default sorting
                },
                {
                  dataset: response.count === 0 ? dummyData : response.feedback,
                  counts: [], // Remove page size options
                },
              )
              // Update stats
              if (submissionCount > 0) {
                $scope.feedbackCount = response.count
                $scope.percentageFeedback = Math.ceil(
                  (response.count / submissionCount) * 100,
                ).toFixed(0)
                $scope.submissionCount = submissionCount
              } else {
                $scope.percentageFeedback = undefined
                $scope.submissionCount = 0
              }
              // Calculate emoji index (Round to the nearest integer)
              $scope.feedbackScore = response.average
              $scope.emojiUrl = emoji.getUrlFromScore($scope.feedbackScore)
              // Remove loader
              $timeout(function () {
                $scope.loading = false
              }, 500)
            },
            function (error) {
              console.error(error)
            },
          )
        }

        $scope.exportCsv = function () {
          const formId = $scope.myform._id
          const formTitle = $scope.myform.title

          $scope.csvDownloading = true
          $q.when(FormFeedback.downloadFeedback(formId, formTitle)).finally(
            function () {
              $scope.csvDownloading = false
            },
          )
        }
      },
    ],
  }
}

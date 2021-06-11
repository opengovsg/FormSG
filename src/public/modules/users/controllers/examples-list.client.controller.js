'use strict'

const ExamplesService = require('../../../services/ExamplesService')
const UserService = require('../../../services/UserService')

const PAGE_SIZE = 16

angular.module('users').controller('ExamplesController', [
  '$q',
  '$scope',
  'GTag',
  '$state',
  '$timeout',
  // When landing on the examples page, FormData is undefined.
  // From the use-template page, if the user was logged in, FormData will be a JSON object with the form field.
  // If the user was not logged in, FormData will contain the formId of the target form.
  'FormData',
  ExamplesController,
])

function ExamplesController($q, $scope, GTag, $state, $timeout, FormData) {
  const vm = this

  vm.user = UserService.getUserFromLocalStorage()

  // Send non-logged in personnel to sign in page
  if (!vm.user) {
    // If there is no form data, they landed on the examples page
    if (!FormData) {
      $state.go('signin', { targetState: 'examples' }, { location: 'replace' })
      // Otherwise, they landed on the /:formId/use-template page, redirect and provide the form data
    } else {
      $state.go(
        'signin',
        { targetState: 'useTemplate', targetFormId: FormData },
        { location: 'replace' },
      )
    }
    return
  }

  vm.agencyName = vm.user.agency.shortName
  vm.agencyId = vm.user.agency._id
  vm.duplicateState = null
  // The form specified in use-template. Undefined if the user is on
  // the default examples page with no specified template
  vm.templateForm = FormData

  vm.searchParams = {
    pageNo: 0,
    filterByAgency: false,
    searchTerm: '',
  }

  vm.uiState = {
    forms: [],
    searchInput: '',
    loadingState: 'free', // Can be free, busy, complete
    hideSearchBar: true,
    totalNumResults: 0,
    numResultsLoadedSoFar: 0,
  }

  // Empty and close search bar - will not affect results shown
  vm.closeSearch = () => {
    vm.uiState.searchInput = ''
    vm.uiState.hideSearchBar = true
  }

  // Empty and open search bar, with focus - will not affect results shown
  vm.openSearch = () => {
    vm.uiState.searchInput = ''
    vm.uiState.hideSearchBar = false
    $timeout(() => {
      angular.element('#search-bar').focus()
      $scope.$apply()
    }, 100)
  }

  //  Update forms shown based on filter
  vm.updateSelection = (filterByAgency) => {
    vm.searchParams.pageNo = 0
    vm.searchParams.filterByAgency = filterByAgency
    // do not update vm.searchParams.searchTerm
    vm.uiState.forms = []
    vm.uiState.numResultsLoadedSoFar = 0
    vm.uiState.loadingState = 'free'
    vm.loadNextPage()
  }

  // Get forms based on search query
  vm.searchForms = (event) => {
    if (event && event.target) {
      event.target.blur()
    }
    vm.searchParams.searchTerm = vm.uiState.searchInput
    vm.updateSelection(vm.searchParams.filterByAgency)

    GTag.examplesSearchTerm(vm.searchParams.searchTerm)
  }

  // Reset to default search params
  vm.resetSearch = () => {
    vm.searchParams.searchTerm = ''
    vm.closeSearch()
    vm.updateSelection(false)
  }

  vm.loadNextPage = () => {
    // Don't load next page if there is ongoing processes
    if (vm.uiState.loadingState !== 'free') return
    vm.uiState.loadingState = 'busy'

    // Extract search parameters
    let pageNo = vm.searchParams.pageNo
    let searchTerm = vm.searchParams.searchTerm
    let agency = vm.searchParams.filterByAgency ? vm.agencyId : ''
    /**
     * Only check total num forms on the first page of a non-empty search query.
     *  In particular, this variable will be `false` when first loading up the examples page,
     *  thereby speeding up the page load time because counting all forms is a slow query
     */
    const shouldGetTotalNumResults = pageNo === 0 && searchTerm !== ''

    // Get next page of forms and add to ui
    $q.when(
      ExamplesService.getExampleForms({
        pageNo,
        searchTerm,
        agency,
        shouldGetTotalNumResults,
      }),
    ).then(
      function (response) {
        /* Form Properties
            ------------------
            _id: form id
            avgFeedback: 4.5
            title: form title
            logo: form logo url
            agency: agency shortname
            colorTheme: blue
          */
        // Update forms listed in UI
        vm.uiState.forms = vm.uiState.forms.concat(response.forms)
        // Update number of results listed in UI only if there is a search query
        if (shouldGetTotalNumResults) {
          vm.uiState.totalNumResults = response.totalNumResults
        }

        const numResultsInPage = response.forms.length
        vm.uiState.numResultsLoadedSoFar += numResultsInPage

        // If number of forms returned is less than pageSize, there are no more forms
        if (numResultsInPage < PAGE_SIZE) {
          vm.uiState.loadingState = 'complete'
          return
        }
        // Increment page number and free loading state
        vm.searchParams.pageNo += 1
        vm.uiState.loadingState = 'free'
      },
      function (error) {
        console.error(error)
        vm.uiState.loadingState = 'complete'
        vm.uiState.totalNumResults = 0
        vm.uiState.numResultsLoadedSoFar = 0
      },
    )
  }
}

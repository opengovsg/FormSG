'use strict'

const { CsvGenerator } = require('../../forms/helpers/CsvGenerator')
const BillingService = require('../../../services/BillingService')

angular
  .module('users')
  .controller('BillingController', [
    '$q',
    '$state',
    '$timeout',
    'Auth',
    'NgTableParams',
    BillingController,
  ])

function BillingController($q, $state, $timeout, Auth, NgTableParams) {
  const vm = this

  vm.user = Auth.getUser()

  // Send non-logged in personnel to sign in page
  if (!vm.user) {
    $state.go('signin', { targetState: 'billing' }, { location: 'replace' })
    return
  }

  vm.authTypeToName = (authType) => {
    switch (authType) {
      case 'SP':
        return 'SingPass'
      case 'MyInfo':
        return 'SingPass (MyInfo)'
      case 'CP':
        return 'CorpPass'
      default:
        return 'NIL'
    }
  }

  vm.authTypeToShortName = (authType) => {
    switch (authType) {
      case 'SP':
        return 'SP'
      case 'MyInfo':
        return 'SP (MI)'
      case 'CP':
        return 'CP'
      default:
        return 'NIL'
    }
  }

  vm.loading = true

  vm.searchState = {
    hide: true,
    input: '',
    intro: true,
  }

  // Empty and close search bar - will not affect results shown
  vm.closeSearch = () => {
    vm.searchState = {
      hide: true,
      input: '',
      intro: false,
    }
  }

  // Empty and open search bar, with focus - will not affect results shown
  vm.openSearch = () => {
    vm.searchState = {
      hide: false,
      input: '',
      intro: false,
    }
    $timeout(() => {
      angular.element('#search-bar').focus()
    }, 100)
  }

  vm.focusOnBilling = () => {
    $timeout(() => {
      angular.element('#intro-container input').focus()
    }, 500)
  }

  vm.searchBillingRecords = () => {
    vm.searchState.intro = false
    angular.element('#search-bar').blur()
    vm.getBillingForTimePeriod(null, vm.searchState.input)
  }

  vm.getBillingForTimePeriod = function (timePeriod, esrvcId) {
    vm.selectedTimePeriod = timePeriod || vm.selectedTimePeriod
    esrvcId = esrvcId || vm.esrvcId
    vm.loading = true
    vm.searchError = false
    $q.when(
      BillingService.getBillingInfo({
        yr: vm.selectedTimePeriod.yr,
        mth: vm.selectedTimePeriod.mth,
        esrvcId,
      }),
    ).then(
      function (response) {
        // Remove loader
        $timeout(function () {
          vm.updateTable(response.loginStats)
          vm.esrvcId = esrvcId
          vm.loading = false
        }, 1000)
      },
      function (error) {
        vm.loading = false
        vm.searchError = true
        console.error(error)
      },
    )
  }

  vm.updateTable = function (dataset) {
    vm.sumTotal = dataset.reduce((a, b) => a + b.total, 0)
    vm.currLoginStats = dataset
    vm.tableParams = new NgTableParams(
      {
        page: 1, // show first page
        count: 50, // count per page
      },
      {
        dataset,
        counts: [], // Remove page size options
      },
    )
  }

  vm.downloadBilling = function () {
    const csvGenerator = new CsvGenerator(
      /* expectedNumRecords= */ 0,
      /* numOfMetaDataRows= */ 1,
    )
    csvGenerator.addMetaData([
      [`Billing data for ${vm.selectedTimePeriod.name}`],
    ])

    csvGenerator.setHeader([
      'Form Name',
      'Form Admin',
      'Authentication',
      'Total Logins',
      'Form Link',
    ])

    vm.currLoginStats.forEach((stat) => {
      csvGenerator.addLine([
        stat.formName,
        stat.adminEmail,
        vm.authTypeToName(stat.authType),
        stat.total,
        $state.href('submitForm', { formId: stat.formId }, { absolute: true }),
      ])
    })

    // Generate a file name without spaces
    const fileName =
      `Billing-${vm.searchState.input}-${vm.selectedTimePeriod.name}.csv`
        .split(' ')
        .join('_')

    csvGenerator.triggerFileDownload(fileName)
  }

  vm.generateTimePeriods = function () {
    // List of all Month Names
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]

    const referenceDate = new Date()
    const numDisplayedMonths = 8
    const timePeriods = []
    for (let i = 0; i <= numDisplayedMonths; i++) {
      const date = new Date(referenceDate)
      date.setMonth(date.getMonth() - i)
      const yr = date.getFullYear()
      const mth = date.getMonth()
      timePeriods.push({
        yr,
        mth,
        name: `${monthNames[mth]} ${yr}`,
      })
    }
    vm.timePeriods = timePeriods
    vm.selectedTimePeriod = vm.timePeriods[0]
  }
}

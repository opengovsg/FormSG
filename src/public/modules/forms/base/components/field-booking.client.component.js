'use strict'

angular.module('forms').component('bookingFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-booking.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    onDropdownClickParent: '&onDropdownClick',
  },
  controller: bookingFieldComponentController,
  controllerAs: 'vm',
})

function bookingFieldComponentController() {
  const vm = this

  vm.$onInit = () => {
    vm.filteredDropdownOptions = []
    vm.infiniteScroll = {}
    // Progressively load more items
    vm.infiniteScroll.numToAdd = 3
    // Initial number of items to load
    vm.infiniteScroll.initalItems = 30
    // Current number of items to show
    vm.infiniteScroll.currentItems = vm.infiniteScroll.initalItems
    // Infinite scroll container (need to specify id in selector for multiple dropdowns to work)
    // Cannot use #id in selector if id starts with number
    vm.infiniteScroll.scrollContainer = `[id="${
      vm.field._id || 'defaultID'
    }"] .ui-select-choices-content`
  }

  vm.dropdownFilter = function (searchString) {
    let dropdownOptions = []
    vm.filteredDropdownOptions = dropdownOptions.filter((option) => {
      return option.toLowerCase().indexOf(searchString.toLowerCase()) > -1
    })
  }

  vm.onDropdownOpenClose = function () {
    if (vm.onDropdownClickParent) {
      vm.onDropdownClickParent()
    }
    // Reset current items to show
    vm.infiniteScroll.currentItems = vm.infiniteScroll.initalItems
  }
  vm.addMoreItems = function () {
    vm.infiniteScroll.currentItems += vm.infiniteScroll.numToAdd
  }
}

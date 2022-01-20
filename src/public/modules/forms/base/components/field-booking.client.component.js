'use strict'

// const axios = require('axios')
const { addSeconds, isSameDay, format } = require('date-fns')

angular.module('forms').component('bookingFieldComponent', {
  templateUrl:
    'modules/forms/base/componentViews/field-booking.client.view.html',
  bindings: {
    field: '<',
    forms: '<',
    onDropdownClickParent: '&onDropdownClick',
  },
  controller: ['$timeout', bookingFieldComponentController],
  controllerAs: 'vm',
})

let yo2 = 0

const getAvailableSlots = async (/*eventCode*/) => {
  // TODO: get actual slots
  // return axios.get(
  //   `https://cal.hack.gov.sg/api/v1/event/${eventCode}/availableSlots`,
  // )
  const things = [
    {
      id: 0,
      eventId: 0,
      maxCapacity: 5,
      startsAt: 1642646072124,
      lengthSeconds: 1800,
    },
    {
      id: 1,
      eventId: 0,
      maxCapacity: 5,
      startsAt: 1642647872124,
      lengthSeconds: 1800,
    },
  ]
  yo2 += 1
  if (yo2 % 2 === 1) return Promise.resolve(things)
  return Promise.resolve(things.slice(0, 1))
}

/**
 *
  id:
    type: number
  eventId:
    type: number
    description: Event UID for which this slot belongs
  maxCapacity:
    type: number
    description: Number of concurrent bookings possible during this timeslot
  startsAt:
    type: number
    description: Epoch time
  lengthSeconds:
    type: number} slot
 */
const TIME_ONLY_FORMAT = 'HH:mm'
const DATE_TIME_FORMAT = 'dd MMM yyyy EEEE, HH:mm'
const convertSlotToFieldOption = (slot) => {
  const startDate = new Date(slot.startsAt)
  const endDate = addSeconds(startDate, slot.lengthSeconds)
  if (isSameDay(startDate, endDate)) {
    // e.g. 17 Jan 2022 Monday, 09:00 - 10:00
    const endTime = format(endDate, TIME_ONLY_FORMAT)
    const dateAndStartTime = format(startDate, DATE_TIME_FORMAT)
    return `${dateAndStartTime} - ${endTime}`
  }
  // e.g. 17 Jan 2022 Monday, 09:00 - 18 Jan 2022 Tuesday, 10:00
  const startDateTime = format(startDate, DATE_TIME_FORMAT)
  const endDateTime = format(endDate, DATE_TIME_FORMAT)
  return `${startDateTime} - ${endDateTime}`
}

const getFieldOptionToSlotIdMap = async (eventCode) => {
  const slots = await getAvailableSlots(eventCode)
  const data = slots.map((slot) => [convertSlotToFieldOption(slot), slot.id])
  return new Map(data)
}

function bookingFieldComponentController($timeout) {
  const vm = this

  vm.updateOptionsError = ''
  vm.isLoadingOptions = true

  vm.updateFieldOptions = () => {
    vm.isLoadingOptions = true
    const fieldControl = vm.forms.myForm[vm.field._id || 'defaultID']
    if (fieldControl) {
      fieldControl.$setUntouched()
    }
    vm.field.fieldValue = ''
    getFieldOptionToSlotIdMap(vm.field.eventCode)
      .then((fieldOptionToSlotId) => {
        // Ensure that loading state is at least 0.5s
        $timeout(() => {
          vm.field.fieldOptionToSlotId = fieldOptionToSlotId
          vm.field.fieldOptions = Array.from(fieldOptionToSlotId.keys())
          vm.updateOptionsError = ''
          vm.isLoadingOptions = false
        }, 500)
      })
      .catch((error) => {
        $timeout(() => {
          vm.isLoadingOptions = false
          console.error(error)
          vm.updateOptionsError =
            'There was an error while retrieving appointments. Please try again.'
        })
      })
  }

  vm.$onInit = () => {
    vm.updateFieldOptions()
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
    let dropdownOptions = vm.field.fieldOptions || []
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

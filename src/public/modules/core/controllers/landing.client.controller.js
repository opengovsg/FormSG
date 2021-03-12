'use strict'

const { examples, testims } = require('../resources/landing-examples')

angular
  .module('users')
  .controller('LandingPageController', [
    '$scope',
    '$state',
    '$timeout',
    '$translate',
    '$translatePartialLoader',
    'AnalyticStats',
    LandingPageController,
  ])

function LandingPageController(
  $scope,
  $state,
  $timeout,
  $translate,
  $translatePartialLoader,
  AnalyticStats,
) {
  const vm = this

  // Set up translations
  $translatePartialLoader.addPart('landing')
  $translate.refresh()

  // Hero
  vm.stats = AnalyticStats

  vm.selectedCarousel = 0
  vm.prevCarousel = () => {
    vm.selectedCarousel =
      vm.selectedCarousel === 0 ? 2 : vm.selectedCarousel - 1
  }
  vm.nextCarousel = () => {
    vm.selectedCarousel =
      vm.selectedCarousel === 2 ? 0 : vm.selectedCarousel + 1
  }

  vm.selectedStorageHow = 0
  const prevStorageHow = () => {
    vm.selectedStorageHow =
      vm.selectedStorageHow === 0 ? 0 : vm.selectedStorageHow - 1
  }
  const nextStorageHow = () => {
    vm.selectedStorageHow =
      vm.selectedStorageHow === 4 ? 4 : vm.selectedStorageHow + 1
  }

  vm.selectedEmailHow = 0
  const prevEmailHow = () => {
    vm.selectedEmailHow =
      vm.selectedEmailHow === 0 ? 0 : vm.selectedEmailHow - 1
  }
  const nextEmailHow = () => {
    vm.selectedEmailHow =
      vm.selectedEmailHow === 4 ? 4 : vm.selectedEmailHow + 1
  }

  vm.signIn = () => {
    $state.go('signin')
  }

  // Examples
  vm.carousel = { examples }

  // Testimonials
  vm.testims = testims
  vm.selectedTestimonial = 0
  vm.prevTestimonial = () => {
    vm.selectedTestimonial =
      vm.selectedTestimonial === 0 ? 2 : vm.selectedTestimonial - 1
  }
  vm.nextTestimonial = () => {
    vm.selectedTestimonial =
      vm.selectedTestimonial === 2 ? 0 : vm.selectedTestimonial + 1
  }

  /**
   * Event handlers for scrolling/swiping
   */
  function addCarouselBehavior() {
    angular.element('#testimonials').slick({
      dots: false,
      arrows: true,
      infinite: true,
      speed: 300,
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode: false,
      adaptiveHeight: true,
      nextArrow: angular.element('#agency-testimonials .carousel-next'),
      prevArrow: angular.element('#agency-testimonials .carousel-prev'),
    })

    angular
      .element('#testimonials')
      .on('swipe', function (event, slick, direction) {
        if (direction === 'left') {
          vm.nextTestimonial()
          $scope.$apply()
        } else if (direction === 'right') {
          vm.prevTestimonial()
          $scope.$apply()
        }
      })
    angular.element('#carousel').slick({
      dots: false,
      infinite: true,
      speed: 300,
      slidesToShow: 3,
      slidesToScroll: 1,
      centerMode: true,
      nextArrow: angular.element('#landing-examples .carousel-next'),
      prevArrow: angular.element('#landing-examples .carousel-prev'),
      responsive: [
        {
          breakpoint: 1800,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 1,
            centerMode: true,
          },
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
            centerMode: false,
          },
        },
      ],
    })
    angular
      .element('#carousel')
      .on('swipe', function (event, slick, direction) {
        if (direction === 'left') {
          vm.nextCarousel()
          $scope.$apply()
        } else if (direction === 'right') {
          vm.prevCarousel()
          $scope.$apply()
        }
      })
    angular.element('.how-container-storage-m').slick({
      dots: false,
      arrows: false,
      infinite: false,
      speed: 300,
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode: false,
    })
    angular.element('.how-container-email-m').slick({
      dots: false,
      arrows: false,
      infinite: false,
      speed: 300,
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode: false,
    })
    angular
      .element('.how-container-storage-m')
      .on('swipe', function (event, slick, direction) {
        if (direction === 'left') {
          nextStorageHow()
          $scope.$apply()
        } else if (direction === 'right') {
          prevStorageHow()
          $scope.$apply()
        }
      })
    angular
      .element('.how-container-email-m')
      .on('swipe', function (event, slick, direction) {
        if (direction === 'left') {
          nextEmailHow()
          $scope.$apply()
        } else if (direction === 'right') {
          prevEmailHow()
          $scope.$apply()
        }
      })
  }

  vm.init = function () {
    vm.currentYear = new Date().getFullYear()
    $timeout(() => {
      addCarouselBehavior()
    })
  }
}

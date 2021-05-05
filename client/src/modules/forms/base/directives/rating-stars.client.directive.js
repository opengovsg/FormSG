'use strict'

/**
 * @typedef {Object} FaClassName
 * @property {String} full - The CSS class for a filled-in shape e.g. 'fa-heart', 'fa-star'
 * @property {String} empty - The CSS class for an empty shape e.g. 'fa-heart-o', 'fa-star-o'
 */

/**
 * Determine empty and filled class names
 * @param {String} shapeType Either 'Star' or 'Heart'
 * @returns {FaClassName}
 */
function getRatingShapeClassNames(shapeType) {
  switch (shapeType) {
    case 'Star':
      return {
        full: 'fa-star',
        empty: 'fa-star-o',
      }
    case 'Heart':
      return {
        full: 'fa-heart',
        empty: 'fa-heart-o',
      }
    default:
      return undefined
  }
}

/**
 * Determine specific empty or filled class name
 * @param {String} shapeType Either 'Star' or 'Heart'
 * @param {Boolean} outline Whether the outlined shape is returned,
 * otherwise the filled shape is returned
 * @returns {FaClassName}
 */
function getIconClassName(shapeType, outline) {
  let shapeData = getRatingShapeClassNames(shapeType)
  if (!shapeData) return undefined
  else if (outline) return shapeData.empty
  else return shapeData.full
}

angular.module('forms').directive('inputStars', ['$timeout', inputStars])

function inputStars($timeout) {
  let directive = {
    restrict: 'E',
    replace: true,
    templateUrl: 'modules/forms/base/directiveViews/input-stars.html',
    require: 'ngModel',
    scope: {
      colortheme: '<',
    },
    link: link,
  }

  return directive

  /**
   * links FontAwesome icons to rating icons
   * @param {Object} scope - Scope of ratings field page
   * @param {Object} element - Element of rating field
   * @param {Object} attrs - Attribute of icon
   * @param {Object} ngModelCtrl - Controller of ratings field
   */
  function link(scope, element, attrs, ngModelCtrl) {
    let state = {
      iconEmpty: getIconClassName(attrs.iconEmpty, true) || 'fa-star-o',
      iconFull: getIconClassName(attrs.iconFull, false) || 'fa-star',
      iconBase: attrs.iconBase || 'fa fa-fw',
    }

    // Validators
    ngModelCtrl.$validators.required = function (viewValue) {
      if (attrs.required) {
        return viewValue > 0
      }
      return true
    }

    // Parser to translate viewValue (integer) into modelValue (string)
    ngModelCtrl.$parsers.push(function (viewValue) {
      if (viewValue === 0) {
        return ''
      }
      return String(viewValue)
    })

    // Formatter to translate modelValue (string) into viewValue (integer)
    ngModelCtrl.$formatters.push(function (modelValue) {
      if (modelValue === '') {
        return 0
      }
      return Number(modelValue)
    })

    // Update directives when any of the bound values are changed
    attrs.$observe('steps', function (steps) {
      scope.items = new Array(+steps)
    })
    attrs.$observe('iconEmpty', function (newEmptyIcon) {
      state.iconEmpty =
        getIconClassName(newEmptyIcon, true) || newEmptyIcon || 'fa-star-o'
    })
    attrs.$observe('iconFull', function (newFullIcon) {
      state.iconFull =
        getIconClassName(newFullIcon, false) || newFullIcon || 'fa-star'
    })

    /**
     * Figure out CSS classes for icons
     */
    scope.getIconClass = function (index) {
      if (index >= ngModelCtrl.$viewValue) {
        return state.iconBase + ' ' + state.iconEmpty
      }

      return state.iconBase + ' ' + state.iconFull + ' active '
    }

    // Behaviour of Rating
    // A. empty and click - highlight
    // B. non-empty and click before/after - change highlight
    // C. non-empty and click on last star - remove all

    scope.unpaintStars = function (hover) {
      scope.paintStars(ngModelCtrl.$viewValue - 1, hover)
    }

    /**
     * Logic to paint the rating shape. If the shape position defined
     * by $index is greater than the previously selected shape,
     * defined by scope.lastValue, the shape is colored.
     * If the shape position is less than the previously selected shape,
     * the colour is unchanged.
     * @param {Number} $index The zero-indexed position
     * @param {Boolean} [hover] Whether the paint is being evaluated during a hover
     */
    scope.paintStars = function ($index, hover = false) {
      // hovering over stars less than previous selection
      // does not change highlight
      if (hover && $index < ngModelCtrl.$viewValue) {
        return
      }

      const items = element.find('li').find('i')

      for (let index = 0; index < items.length; index++) {
        let shapeElement = angular.element(items[index])

        if ($index >= index) {
          shapeElement.removeClass(state.iconEmpty)
          shapeElement.addClass(state.iconFull)
          shapeElement.addClass('active')
        } else {
          shapeElement.removeClass(state.iconFull)
          shapeElement.addClass(state.iconEmpty)
          shapeElement.removeClass('active')
        }
      }
    }

    /**
     * Calls $setViewValue on click to update ngModel
     */
    scope.setValue = function (index, _event) {
      // click on last selected shape removes all
      if (index === ngModelCtrl.$viewValue - 1) {
        return reset()
      }
      // set model value
      ngModelCtrl.$setViewValue(index + 1)
      ngModelCtrl.$setTouched()
      ngModelCtrl.$setDirty()
    }

    /**
     * Resets the state of the rating star directive
     */
    function reset() {
      // Initialise ngModel
      ngModelCtrl.$setViewValue(0)
      ngModelCtrl.$setUntouched()
      ngModelCtrl.$setPristine()
      scope.unpaintStars(false)
    }

    // Initialise
    scope.items = new Array(+attrs.steps)
    reset()

    // Necessary to force a validation on init
    $timeout(() => {
      ngModelCtrl.$validate()
    }, 0)
  }
}

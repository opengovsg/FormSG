// Retrieved from https://codepen.io/robmazan/pen/gbeagj

angular
  .module('core')
  .directive('onClickOutside', [
    '$document',
    '$parse',
    '$timeout',
    onClickOutside,
  ])

function onClickOutside($document, $parse, $timeout) {
  return {
    restrict: 'A',
    compile: function (tElement, tAttrs) {
      const fn = $parse(tAttrs.onClickOutside)

      return function (scope, iElement, iAttrs) {
        function eventHandler(ev) {
          if (iElement[0].contains(ev.target)) {
            $document.one('click touchend', eventHandler)
          } else {
            scope.$apply(function () {
              fn(scope)
            })
          }
        }
        scope.$watch(iAttrs.onClickWatcher, function (activate) {
          if (activate) {
            $timeout(function () {
              // Need to defer adding the click handler, otherwise it would
              // catch the click event from ng-click and trigger handler expression immediately
              $document.one('click touchend', eventHandler)
            })
          } else {
            $document.off('click touchend', eventHandler)
          }
        })
      }
    },
  }
}

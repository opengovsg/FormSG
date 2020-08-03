angular.module('forms').directive('scrollToId', scrollToId)

function scrollToId() {
  return {
    restrict: 'A',
    scope: {
      scrollTo: '@',
    },
    link: function (scope, $elm, _attr) {
      $elm.on('click', function () {
        $('html,body').animate(
          { scrollTop: $(scope.scrollTo).offset().top },
          'fast',
        )
      })
    },
  }
}

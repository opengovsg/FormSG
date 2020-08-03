angular.module('forms').service('Rating', [Rating])

function Rating() {
  this.steps = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  this.shapes = ['Heart', 'Star']
}

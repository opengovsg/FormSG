const { zipWith } = require('lodash')

angular.module('forms').service('Attachment', [Attachment])

function Attachment() {
  this.sizes = ['1', '2', '3', '7', '10', '20']

  this.descriptions = ['1 MB', '2 MB', '3 MB', '7 MB', '10 MB', '20 MB']

  this.dropdown = zipWith(this.descriptions, this.sizes, (desc, size) => {
    return { name: desc, value: size }
  })
}

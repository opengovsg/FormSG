const { zipWith } = require('lodash')

angular.module('forms').service('Attachment', [Attachment])

function Attachment() {
  this.sizes = ['1', '3', '7']

  this.descriptions = [
    '1 MB (e.g. Pictures)',
    '3 MB (e.g. PDF files)',
    '7 MB (e.g. Slides)',
  ]

  this.dropdown = zipWith(this.descriptions, this.sizes, (desc, size) => {
    return { name: desc, value: size }
  })
}

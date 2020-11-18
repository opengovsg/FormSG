const { zipWith } = require('lodash')

angular.module('forms').service('Attachment', [Attachment])

function Attachment() {
  this.sizes = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
  ]

  this.descriptions = [
    '1 MB (e.g. Pictures)',
    '2 MB (e.g. Pictures)',
    '3 MB (e.g. PDF files)',
    '4 MB (e.g. PDF files)',
    '5 MB (e.g. PDF files)',
    '6 MB (e.g. PDF files)',
    '7 MB (e.g. Video files)',
    '8 MB (e.g. Video files)',
    '9 MB (e.g. Video files)',
    '10 MB (e.g. Video files)',
    '11 MB (e.g. Video files)',
    '12 MB (e.g. Video files)',
    '13 MB (e.g. Video files)',
    '14 MB (e.g. Video files)',
    '15 MB (e.g. Video files)',
    '16 MB (e.g. Video files)',
    '17 MB (e.g. Video files)',
    '18 MB (e.g. Video files)',
    '19 MB (e.g. Video files)',
    '20 MB (e.g. Video files)',
  ]

  this.dropdown = zipWith(this.descriptions, this.sizes, (desc, size) => {
    return { name: desc, value: size }
  })
}

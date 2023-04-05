// Backward-compatible version of of array buffer function.

function promisifyFile(obj: FileReader): Promise<ArrayBuffer> {
  return new Promise(function (resolve, reject) {
    obj.onload = obj.onerror = function (evt) {
      obj.onload = obj.onerror = null
      console.log(obj.result)
      evt.type === 'load' && obj.result
        ? resolve(obj.result as ArrayBuffer)
        : reject(new Error('Failed to read the blob/file'))
    }
  })
}

const fileArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  let buffer
  // arrayBuffer is only compatible with Safari 14 onwards
  // for older browsers, use readAsArrayBuffer
  if (!file.arrayBuffer) {
    const fr = new FileReader()
    fr.readAsArrayBuffer(file)
    buffer = await promisifyFile(fr)
  } else {
    buffer = await file.arrayBuffer()
  }
  return buffer
}

export default fileArrayBuffer

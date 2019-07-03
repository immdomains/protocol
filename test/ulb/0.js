require('./chai')
require('colors')

//override process.emit
const processEmit = process.emit
require('ganache-cli')
process.emit = function (error) {
  processEmit.apply(this, processEmit)
}

process.on('uncaughtException', (error) => {
  console.log(error)
})

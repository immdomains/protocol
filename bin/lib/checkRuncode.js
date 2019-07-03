const getUlb = require('./getUlb')
const amorphHex = require('amorph-hex')

module.exports = async function checkRuncode(network, address) {
  console.log('Checking runcode...'.cyan)

  const ulb = await getUlb(network)
  const runcode = await ulb.eth.getCode(address)
  console.log(runcode.to(amorphHex.unprefixed))
  const immDomainsInfo = require('../../')

  if (runcode.equals(immDomainsInfo.runcode)) {
    console.log(`Runcode matches`.green)
  } else {
    console.log('Runcode does not match. Something is wrong'.red)
    process.exit()
  }
}

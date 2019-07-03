const Amorph = require('amorph')
const amorphHex = require('amorph-hex')

const output = require('./output')

if (output.errors) {
  throw new Error(output.errors[0].formattedMessage)
}

const immDomainsOutput = output.contracts['ImmDomains.sol'].ImmDomains

module.exports = {
  code: Amorph.from(amorphHex.unprefixed, immDomainsOutput.evm.bytecode.object),
  abi: immDomainsOutput.abi,
  runcode: Amorph.from(amorphHex.unprefixed, immDomainsOutput.evm.deployedBytecode.object)
}

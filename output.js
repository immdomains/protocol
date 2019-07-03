const solc = require('solc')
const fs = require('fs')
const path = require('path')

module.exports = JSON.parse(solc.compile(JSON.stringify({
  language: 'Solidity',
  sources: {
    'ImmDomains.sol': {
      content: fs.readFileSync(`${__dirname}/contracts/ImmDomains.sol`, 'utf8')
    }
  },
  settings: {
		outputSelection: {
			'*': {
				'*': [ '*' ]
			}
		}
	}
})))

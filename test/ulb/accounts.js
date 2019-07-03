const _ = require('lodash')
const Account = require('ultralightbeam/lib/Account')

module.exports = {
  alice: Account.generate(),
  bob: Account.generate(),
  charlie: Account.generate(),
  david: Account.generate(),
  eve: Account.generate(),
  frank: Account.generate()
}

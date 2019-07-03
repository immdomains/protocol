const ultralightbeam = require('./ultralightbeam')
const immDomainsInfo = require('../../')
const Amorph = require('amorph')
const accounts = require('./accounts')
const FailedTransactionError = require('ultralightbeam/lib/errors/FailedTransaction')
const getRandomAmorph = require('ultralightbeam/lib/getRandomAmorph')
const amorphAscii = require('amorph-ascii')
const chai = require('chai')
const amorphHex = require('amorph-hex')
const delay = require('delay')
const amorphBoolean = require('amorph-boolean')
const params = require('../params')

describe('ImmDomains', () => {

  const amorphTrue = Amorph.from(amorphBoolean, true)
  const amorphFalse = Amorph.from(amorphBoolean, false)
  const nullAddress = new Amorph((new Uint8Array(20)).fill(0))

  let immDomains

  describe('deploy', () => {
    it('should deploy', () => {
      return ultralightbeam.solDeploy(immDomainsInfo.code, immDomainsInfo.abi, [], {
        from: accounts.alice
      }).then((_immDomains) => {
        immDomains = _immDomains
      })
    })
    it('should have correct code', () => {
      return ultralightbeam.eth.getCode(immDomains.address).should.eventually.amorphEqual(immDomainsInfo.runcode)
    })
  })
  describe('ownership', () => {
    it('owner should be alice', () => {
      return immDomains.fetch('owner()', []).should.eventually.amorphEqual(accounts.alice.address)
    })
    it('bob should NOT be able to change owner', () => {
      return immDomains.broadcast('setOwner(address)', [accounts.bob.address], {
        from: accounts.bob
      }).getConfirmation().should.be.rejectedWith(FailedTransactionError)
    })
    it('owner should be alice', () => {
      return immDomains.fetch('owner()', []).should.eventually.amorphEqual(accounts.alice.address)
    })
    it('alice should be able to change owner to bob', () => {
      return immDomains.broadcast('setOwner(address)', [accounts.bob.address], {
        from: accounts.alice
      }).getConfirmation()
    })
    it('owner should be bob', () => {
      return immDomains.fetch('owner()', []).should.eventually.amorphEqual(accounts.bob.address)
    })
    it('bob should be able to change owner to alice', () => {
      return immDomains.broadcast('setOwner(address)', [accounts.alice.address], {
        from: accounts.bob
      }).getConfirmation()
    })
    it('owner should be alice', () => {
      return immDomains.fetch('owner()', []).should.eventually.amorphEqual(accounts.alice.address)
    })
  })
  describe('registrar', () => {
    it('owner should be alice', () => {
      return immDomains.fetch('registrar()', []).should.eventually.amorphEqual(accounts.alice.address)
    })
    it('bob should NOT be able to change registrar', () => {
      return immDomains.broadcast('setRegistrar(address)', [accounts.bob.address], {
        from: accounts.bob
      }).getConfirmation().should.be.rejectedWith(FailedTransactionError)
    })
    it('registrar should be alice', () => {
      return immDomains.fetch('registrar()', []).should.eventually.amorphEqual(accounts.alice.address)
    })
    it('alice should be able to change registrar to bob', () => {
      return immDomains.broadcast('setRegistrar(address)', [accounts.bob.address], {
        from: accounts.alice
      }).getConfirmation()
    })
    it('registrar should be bob', () => {
      return immDomains.fetch('registrar()', []).should.eventually.amorphEqual(accounts.bob.address)
    })
    it('bob should NOT be able to change registrar', () => {
      return immDomains.broadcast('setRegistrar(address)', [accounts.charlie.address], {
        from: accounts.bob
      }).getConfirmation().should.be.rejectedWith(FailedTransactionError)
    })
    it('registrar should be bob', () => {
      return immDomains.fetch('registrar()', []).should.eventually.amorphEqual(accounts.bob.address)
    })

  })
  describe('characters', () => {
    describe('valid', () => {
      params.characterAsciis.valid.forEach((characterAscii) => {
        it(`"${characterAscii}", #${characterAscii.charCodeAt(0)} should be valid`, () => {
          const character = Amorph.from(amorphAscii, characterAscii)
          return immDomains.fetch('isValidCharacter(uint8)', [character]).should.eventually.amorphEqual(amorphTrue)
        })
      })
    })
    describe('invalid', () => {
      params.characterAsciis.invalid.forEach((characterAscii) => {
        it(`"${characterAscii}", #${characterAscii.charCodeAt(0)} should be invalid`, () => {
          const character = Amorph.from(amorphAscii, characterAscii)
          return immDomains.fetch('isValidCharacter(uint8)', [character]).should.eventually.amorphEqual(amorphFalse)
        })
      })
    })
  })
  describe('domains', () => {
    describe('valid', () => {
      params.domainAsciis.valid.forEach((domainAscii) => {
        it(`"${domainAscii}" should be valid`, () => {
          const domain = Amorph.from(amorphAscii, domainAscii)
          return immDomains.fetch('isValidDomain(bytes)', [domain]).should.eventually.amorphEqual(amorphTrue)
        })
      })
    })
    describe('invalid', () => {
      params.domainAsciis.invalid.forEach((domainAscii) => {
        it(`"${domainAscii}" should be invalid`, () => {
          const domain = Amorph.from(amorphAscii, domainAscii)
          return immDomains.fetch('isValidDomain(bytes)', [domain]).should.eventually.amorphEqual(amorphFalse)
        })
      })
    })
  })
  describe('register', () => {
    describe('valid domains', () => {
      params.domainAsciis.valid.forEach((domainAscii) => {
        describe(`"${domainAscii}"`, () => {
          const domain = Amorph.from(amorphAscii, domainAscii)
          const address = getRandomAmorph(20)
          it('should be set to null address', () => {
            return immDomains.fetch('addresses(bytes)', [domain]).should.eventually.amorphEqual(nullAddress)
          })
          it('alice should not be able to register', () => {
            return immDomains.broadcast('register(bytes,address)', [
              domain,
              address
            ], {
              from: accounts.alice
            }).getConfirmation().should.be.rejectedWith(FailedTransactionError)
          })
          it('should be set to null address', () => {
            return immDomains.fetch('addresses(bytes)', [domain]).should.eventually.amorphEqual(nullAddress)
          })
          it('bob should register', () => {
            return immDomains.broadcast('register(bytes,address)', [
              domain,
              address
            ], {
              from: accounts.bob
            }).getConfirmation()
          })
          it('should be set to address', () => {
            return immDomains.fetch('addresses(bytes)', [domain]).should.eventually.amorphEqual(address)
          })
          it('bob should not be able to re-register', () => {
            return immDomains.broadcast('register(bytes,address)', [
              domain,
              getRandomAmorph(20)
            ], {
              from: accounts.bob
            }).getConfirmation().should.be.rejectedWith(FailedTransactionError)
          })
          it('should still be set to address', () => {
            return immDomains.fetch('addresses(bytes)', [domain]).should.eventually.amorphEqual(address)
          })
        })
      })
    })
    describe('invalid domains', () => {
      params.domainAsciis.invalid.forEach((domainAscii) => {
        describe(`"${domainAscii}"`, () => {
          const domain = Amorph.from(amorphAscii, domainAscii)
          const address = getRandomAmorph(20)
          it('should be set to null address', () => {
            return immDomains.fetch('addresses(bytes)', [domain]).should.eventually.amorphEqual(nullAddress)
          })
          it('alice should not be able to register', () => {
            return immDomains.broadcast('register(bytes,address)', [
              domain,
              address
            ], {
              from: accounts.alice
            }).getConfirmation().should.be.rejectedWith(FailedTransactionError)
          })
          it('bob should not be able to register', () => {
            return immDomains.broadcast('register(bytes,address)', [
              domain,
              address
            ], {
              from: accounts.bob
            }).getConfirmation().should.be.rejectedWith(FailedTransactionError)
          })
          it('should be set to null address', () => {
            return immDomains.fetch('addresses(bytes)', [domain]).should.eventually.amorphEqual(nullAddress)
          })
        })
      })
    })

  })

})

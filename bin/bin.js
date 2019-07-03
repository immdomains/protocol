const commander = require('commander')
const colors = require('colors')
const clear = require('clear')
const fs = require('fs')

const getUlb = require('./lib/getUlb')
const checkRuncode = require('./lib/checkRuncode')
const recursivePrompt = require('./lib/recursivePrompt')
const recursivePromptAddress = require('./lib/recursivePromptAddress')
const getAccount = require('./lib/getAccount')

const Amorph = require('amorph')
const amorphHex = require('amorph-hex')
const prompt = require('prompt-promise')
const SolWrapper = require('ultralightbeam/lib/SolWrapper')
const getRandomAmorph = require('ultralightbeam/lib/getRandomAmorph')
const amorphAscii = require('amorph-ascii')
const amorphNumber = require('amorph-number')
const keythereum = require('keythereum')
const Account = require('ultralightbeam/lib/Account')
const request = require('request-promise')

require('dotenv').config()

process.on('uncaughtException', (error) => {
  console.log(error)
})



console.log("\r\n\r\n\r\n\r\n\r\n")

commander
  .version('0.0.0')
  .command('deploy <keypath>').action(async (keypath) => {

    const account = await getAccount(keypath)

    const network = await recursivePrompt('network: ', (network) => {
      if (network !== 'rinkeby' && network !== 'mainnet') {
        throw new Error('only rinkeby & mainnet supported')
      }
    })

    const ulb = await getUlb(network)
    const immDomainsInfo = require('../')

    console.log('Deploying ImmDomains.sol...'.cyan)

    const immDomains = await ulb.solDeploy(immDomainsInfo.code, immDomainsInfo.abi, [], {
      from: account
    })
    console.log(`Deployed ImmDomains.sol to ${immDomains.address.to(amorphHex.unprefixed)}`.green)

    await checkRuncode(network, immDomains.address)

    process.exit()
  })

commander
  .version('0.0.0')
  .command('register <keypath>').action(async (keypath) => {

    const account = await getAccount(keypath)

    const network = await recursivePrompt('network: ', (network) => {
      if (network !== 'rinkeby' && network !== 'mainnet') {
        throw new Error('only rinkeby & mainnet supported')
      }
    })
    const ulb = await getUlb(network)

    const contractAddress = await recursivePromptAddress('contract address (hex): ')

    await checkRuncode(network, contractAddress)

    const immDomainsInfo = require('../')
    const immDomains = new SolWrapper(ulb, immDomainsInfo.abi, contractAddress)

    const domainAscii = await prompt('domain: ')
    const domain = Amorph.from(amorphAscii, domainAscii)

    const address = await recursivePromptAddress('address (hex): ')

    console.log(`Registering "${domainAscii}" to ${address.to(amorphHex.unprefixed)}...`.cyan)

    await immDomains.broadcast('register(bytes,address)', [domain, address], {
      from: account
    }).getConfirmation()

    console.log(`Confirming...`.cyan)

    const fetchedAddress = await immDomains.fetch('addresses(bytes)', [domain])
    if (address.equals(fetchedAddress)) {
      console.log('Token successfully minted!'.cyan)
    } else {
      console.log(`Something went wrong. Address should be be ${address.to(amorphHex.unprefixed)} not ${fetchedAddress.to(amorphHex.unprefixed)}`.red)
    }

    process.exit()

  })

  commander
    .version('0.0.0')
    .command('register-tokens <keypath>').action(async (keypath) => {

      const account = await getAccount(keypath)

      const network = await recursivePrompt('network: ', (network) => {
        if (network !== 'rinkeby' && network !== 'mainnet') {
          throw new Error('only rinkeby & mainnet supported')
        }
      })
      const ulb = await getUlb(network)

      const contractAddress = await recursivePromptAddress('contract address (hex): ')

      await checkRuncode(network, contractAddress)

      const immDomainsInfo = require('../')
      const immDomains = new SolWrapper(ulb, immDomainsInfo.abi, contractAddress)

      const cmcResults = await request({
        method: 'GET',
        uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
        qs: {
          start: 1,
          limit: 100,
          sort: 'market_cap'
        },
        headers: {
          'X-CMC_PRO_API_KEY': process.env.CMC_PRO_API_KEY
        },
        json: true,
        gzip: true
      })

      const mewAssets = await request({
        method: 'GET',
        uri: 'https://raw.githubusercontent.com/MyEtherWallet/ethereum-lists/master/dist/tokens/eth/tokens-eth.json',
        json: true
      })


      const assets = cmcResults.data.filter((asset) => {
        if(asset.platform === null) {
          return false
        }

        if (asset.platform.id !== 1027) {
          return false
        }

        const addressHexPrefixed = asset.platform.token_address.toLowerCase()
        const mewAsset = mewAssets.find((mewAsset) => {
          return addressHexPrefixed === mewAsset.address.toLowerCase()
        })

        if (!mewAsset) {
          console.log('NO MEW', asset.symbol)
          return false
        }

        if (mewAsset.symbol !== asset.symbol) {
          console.log('ASSET MISMATCH', asset.symbol, mewAsset.symbol)
          return false
        }


        if (mewAsset.type !== 'ERC20') {
          console.log('NOT ERC20', asset.symbol)
          return false
        }

        return true
      }).map((asset) => {
        return {
          symbol: Amorph.from(amorphAscii, asset.symbol.toLowerCase()),
          address: Amorph.from(amorphHex.prefixed, asset.platform.token_address.toLowerCase())
        }
      })

      for (let i = 0; i < assets.length; i++) {
        await register(assets[i])
      }

      async function register(asset) {
        const assetSymbolAscii = asset.symbol.to(amorphAscii)
        const promptSymbolAscii = await prompt(`Register "${assetSymbolAscii}" to ${asset.address.to(amorphHex.unprefixed)} (type symbol to confim or "." to skip)?`)
        if (promptSymbolAscii === '.') {
          console.log('Skipped')
          return
        }
        if (assetSymbolAscii !== promptSymbolAscii) {
          console.log('Symbol mismatch'.red)
          return register(asset)
        }
        console.log(`Registering "${assetSymbolAscii}" to ${asset.address.to(amorphHex.unprefixed)}...`.cyan)

        const transactionMonitor = immDomains.broadcast('register(bytes,address)', [asset.symbol, asset.address], {
          from: account
        })

        console.log(`Confirming...`.cyan)

        await transactionMonitor.getConfirmation()

        const fetchedAddress = await immDomains.fetch('addresses(bytes)', [asset.symbol])
        if (asset.address.equals(fetchedAddress)) {
          console.log('Token successfully minted!'.cyan)
        } else {
          console.log(`Something went wrong. Address should be be ${address.to(amorphHex.unprefixed)} not ${fetchedAddress.to(amorphHex.unprefixed)}`.red)
          process.exit()
        }


      }

      process.exit()

    })


commander.parse(process.argv)

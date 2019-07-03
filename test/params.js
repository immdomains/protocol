module.exports = {
  characterAsciis: {
    valid: [
      'a',
      'z',
      '0',
      '9'
    ],
    invalid: [
      'A',
      'Z',
      '/',
      '.',
      ':',
      '@',
      '[',
      '`',
      '{'
    ]
  },
  domainAsciis: {
    valid: [
      'a',
      'z',
      '0',
      'az09',
      '90az'
    ],
    invalid: [
      '',
      'A',
      'Z',
      'az09/',
      '/az09',
      '.',
      ' az09',
      'az09 ',
      'az.09'
    ]
  }
}

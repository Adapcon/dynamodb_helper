module.exports = {
  root: true,
  'extends': [
    'airbnb-base'
  ],
  'rules': {
    'no-underscore-dangle': 'off',
    'import/no-unresolved': [2, { caseSensitive: true, commonjs: true }],
    'arrow-parens': [2, 'as-needed'],
    'no-trailing-spaces': ['error', { 'skipBlankLines': true, 'ignoreComments': true }],
    'no-confusing-arrow': ['error', { 'allowParens': true }],
    'class-methods-use-this': 'off',
    'consistent-return': 'off',
    'linebreak-style': 0,
    'no-plusplus': 'off',
    'no-new': 'off',
    'prefer-promise-reject-errors': 'off',
    'nonblock-statement-body-position': ['error', 'beside', { 'overrides': { 'if': 'any' } }],
    curly: ['error', 'multi-or-nest', 'consistent'],
    'no-use-before-define': 'off',
    'no-unused-vars': ['error', { 'varsIgnorePattern': '^customScript' }],
    radix: 'off',
    camelcase: 'off',
    'max-len': [
      'error', {
        'ignoreComments': true,
        'ignoreTrailingComments': true,
        'ignoreUrls': true,
        'ignoreStrings': true,
        'ignoreRegExpLiterals': true
      }
    ]
  },
  'env': {
    'browser': true,
    'node': true,
  },
  'settings': {
    'import/resolver': 'node'
  },
  'globals': {
    brain: true,
    PromiseCall: true,
    $: true,
    ProVue: true,
    moment: true,
    _: true,
    json2csv: true,
    genericRenderTable: true,
    genericFormatCnpjCpf: true,
    genericFormatPhone: true,
  },
};

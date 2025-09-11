import js from '@eslint/js';

// Custom rule to allow console statements only when wrapped in if (DEBUG)
const noConsoleUnlessDebug = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow console statements unless wrapped in if (DEBUG)',
      category: 'Best Practices',
      recommended: false
    },
    fixable: null,
    schema: []
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === 'MemberExpression' &&
            node.callee.object.name === 'console') {

          // Check if this console statement is inside an if (DEBUG) block
          let parent = node.parent;
          let isInDebugBlock = false;

          while (parent) {
            if (parent.type === 'IfStatement' &&
                parent.test &&
                parent.test.type === 'Identifier' &&
                parent.test.name === 'DEBUG') {
              isInDebugBlock = true;
              break;
            }
            parent = parent.parent;
          }

          if (!isInDebugBlock) {
            context.report({
              node,
              message: 'Console statements should be wrapped in if (DEBUG) blocks'
            });
          }
        }
      }
    };
  }
};

export default [
  // Base configuration for all JavaScript files
  js.configs.recommended,

  // Project-specific configuration
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        // Three.js globals (if using global imports)
        THREE: 'readonly',
        // Debug flag
        DEBUG: 'readonly',
        // Node.js globals (for build scripts)
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    },
    rules: {
      // Code quality rules
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'no-console': 'off', // Disable default no-console rule
      'custom/no-console-unless-debug': 'warn', // Use our custom rule
      'no-debugger': 'error',
      'no-alert': 'error',

      // Style and consistency rules
      'indent': ['error', 2],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', 'never'],
      'keyword-spacing': 'error',
      'space-infix-ops': 'error',
      'eol-last': 'error',
      'no-trailing-spaces': 'error',

      // Best practices
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Three.js specific considerations
      'no-undef': 'error', // Catch undefined variables
      'camelcase': ['error', {
        properties: 'never',
        ignoreDestructuring: true
      }]
    },
    plugins: {
      'custom': {
        rules: {
          'no-console-unless-debug': noConsoleUnlessDebug
        }
      }
    }
  },

  // Configuration for build scripts and Node.js files
  {
    files: ['scripts/**/*.js', 'vite.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    }
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'public/**',
      '*.min.js',
      'coverage/**',
      '.vscode/**',
      '.git/**'
    ]
  }
];

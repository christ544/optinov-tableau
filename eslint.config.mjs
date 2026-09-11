import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/*
  Configuration ESLint au format « plat » (le format natif d'ESLint 9).

  L'ancienne version passait par le pont de compatibilité FlatCompat pour
  charger « next/core-web-vitals » à l'ancienne manière. Or eslint-config-next
  16 fournit déjà ses réglages au format plat, et les faire repasser par le
  pont provoquait un plantage d'ESLint avant même l'analyse du premier fichier
  (« Converting circular structure to JSON »). On importe donc directement.
*/
const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    /*
      Fichiers CommonJS (`server.cjs`, le fichier de démarrage de Passenger sur
      PlanetHoster). `require()` n'y est pas un choix de style : Passenger charge
      le fichier de démarrage avec `require()`, et comme le projet déclare
      `"type": "module"`, seule l'extension `.cjs` permet d'y répondre. La règle
      qui interdit `require()` — pensée pour le code applicatif, écrit en modules
      ES — n'a donc pas de sens ici.
    */
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Fichiers générés par Payload ou Next : on ne les relit pas.
    ignores: [
      '.next/',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
      'src/app/(payload)/admin/importMap.js',
      'src/migrations/',
    ],
  },
]

export default eslintConfig

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/graphql',
  documents: ['src/**/*.{ts,tsx}'],
  generates: {
    'src/lib/__generated__/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typed-document-node',
      ],
      config: {
        skipTypename: false,
        dedupeFragments: true,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;

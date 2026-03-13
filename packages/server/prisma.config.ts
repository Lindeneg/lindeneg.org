import { defineConfig } from 'prisma/config';
import { unwrap, loadEnv, withRequired, toString, refine, nonEmpty } from '@lindeneg/cl-env';

const env = unwrap(
  loadEnv(
    {
      files: [],
      optionalFiles: ['.env', '.env.default', '.env.local', '.env.test'],
      includeProcessEnv: false,
      transformKeys: false,
    },
    {
      DATABASE_URL: withRequired(refine(toString(), nonEmpty())),
    }
  )
);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env.DATABASE_URL,
  },
});

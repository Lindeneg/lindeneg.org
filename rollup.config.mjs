import typescript from 'rollup-plugin-typescript2';
import cleaner from 'rollup-plugin-cleaner';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default () => {
    return {
        input: './src/index.ts',
        output: {
            file: './dist/index.mjs',
            format: 'esm',
            exports: 'named',
        },
        external: [
            '@lindeneg/funkallero',
            '@lindeneg/funkallero-auth-service',
            '@prisma/client',
            "dotenv",
            'express',
            'handlebars',
            'zod',
            'cookie-parser',
            'cloudinary',
            'showdown',
        ],
        plugins: [
            cleaner({
                targets: ['./dist'],
            }),
            nodeResolve({
                preferBuiltins: true,
            }),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.server.json',
                clean: true,
            }),
        ],
    };
};

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import json from '@rollup/plugin-json';
import packageJson from "./package.json" assert { type: "json" }

export default {
    input: 'src/index.js',
    output: [
        {
            file: packageJson.main,
            format: 'cjs',
            sourcemap: true,
            strict: false
        }
    ],
    plugins: [
        resolve(),
        commonjs(),
        json(),
        terser()
    ],
}
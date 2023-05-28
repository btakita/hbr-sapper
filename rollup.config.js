import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { default as shim } from 'rollup-plugin-shim';
import { builtinModules } from 'module';

const tsOptions = {
	checkJs: !!process.env.TS_CHECK_ENABLED,
	module: 'esnext'
};

function template(kind, external) {
	return {
		input: `runtime/src/${kind}/index.ts`,
		output: {
			file: `runtime/${kind}.js`,
			format: 'es',
			inlineDynamicImports: true,
			paths: id => id.replace('@sapper', '.')
		},
		external,
		plugins: [
			resolve({
				extensions: ['.mjs', '.js', '.ts', '.json']
			}),
			shim({
				'stream/web': 'export {};',
			}),
			commonjs(),
			typescript(tsOptions)
		]
	};
}

export default [
	template('app', id => /^(svelte\/?|@sapper\/)/.test(id)),
	template('app-lib', id => /^(svelte\/?|@sapper\/)/.test(id)),
	template('server', id => /^(svelte\/?|@sapper\/)/.test(id) || builtinModules.includes(id)),
];

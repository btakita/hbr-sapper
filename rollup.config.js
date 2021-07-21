import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import { builtinModules } from 'module';

const tsOptions = {
	check: !!process.env.TS_CHECK_ENABLED,
	tsconfigOverride: {
		compilerOptions: { module: 'esnext' }
	}
};

function template(kind, external) {
	return {
		input: `runtime/src/${kind}/index.ts`,
		output: {
			file: `runtime/${kind}.js`,
			format: 'es',
			paths: id => id.replace('@sapper', '.')
		},
		external,
		plugins: [
			resolve({
				extensions: ['.mjs', '.js', '.ts', '.json']
			}),
			commonjs(),
			typescript(tsOptions)
		]
	};
}

export default [
	template('app', id => /^(svelte\/?|@sapper\/)/.test(id)),
	template('server', id => /^(svelte\/?|@sapper\/)/.test(id) || builtinModules.includes(id)),
];

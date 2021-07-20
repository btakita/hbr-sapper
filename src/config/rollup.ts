import { accessSync, constants } from 'fs';
import { InputOption, OutputOptions } from 'rollup';
import { dev, src, dest } from './env';
import path from 'path';

const sourcemap = dev ? 'inline' : false;

export default {
	dev,

	client: {
		input: (): InputOption => {
			return `${src}/client.js`;
		},

		output: (): OutputOptions => {
			let dir = `${dest}/client`;
			if (process.env.SAPPER_LEGACY_BUILD) dir += '/legacy';

			return {
				dir,
				entryFileNames: '[name].[hash].js',
				chunkFileNames: '[name].[hash].js',
				format: 'esm',
				sourcemap
			};
		}
	},

	server: {
		input: (): InputOption => {
			return {
				server: `${src}/server.js`
			};
		},

		output: (): OutputOptions => {
			return {
				dir: `${dest}/server`,
				format: get_server_format(),
				sourcemap
			};
		}
	},

	serviceworker: {
		input: (): InputOption => {
			return `${src}/service-worker.js`;
		},

		output: (): OutputOptions => {
			return {
				file: `${dest}/service-worker.js`,
				format: 'iife',
				sourcemap
			};
		}
	}
};
function get_server_format() {
	const cwd = '.'
  try {
    const input = path.resolve(cwd, 'rollup.config.mjs')
    accessSync(input, constants.F_OK | constants.R_OK)
    return 'es'
  } catch (_e) {
    const input = path.resolve(cwd, 'rollup.config.js')
    accessSync(input, constants.F_OK | constants.R_OK)
    return 'cjs'
  }
}

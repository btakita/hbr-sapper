import * as path from 'path';
import RollupCompiler from './RollupCompiler.js';
import { WebpackCompiler } from './WebpackCompiler.js';
import { set_dev, set_src, set_dest } from '../../config/env.js';
import { get_config_extname } from './config_extname.js'

export type Compiler = RollupCompiler | WebpackCompiler;

export type Compilers = {
	client: Compiler;
	server: Compiler;
	serviceworker?: Compiler;
}

export default async function create_compilers(
	bundler: 'rollup' | 'webpack',
	cwd: string,
	src: string,
	routes: string,
	dest: string,
	dev: boolean
): Promise<Compilers> {
	set_dev(dev);
	set_src(src);
	set_dest(dest);

	if (bundler === 'rollup') {
		const config = await RollupCompiler.load_config(cwd);
		await validate_config(cwd, config, 'rollup');

		normalize_rollup_config(config.client);
		normalize_rollup_config(config.server);

		if (config.serviceworker) {
			normalize_rollup_config(config.serviceworker);
		}

		return {
			client: new RollupCompiler(config.client, routes),
			server: new RollupCompiler(config.server, routes),
			serviceworker: config.serviceworker && new RollupCompiler(config.serviceworker, routes)
		};
	}

	if (bundler === 'webpack') {
		const config = await import(path.resolve(cwd, 'webpack.config.js'))
		await validate_config(cwd, config, 'webpack');

		return {
			client: new WebpackCompiler(config.client),
			server: new WebpackCompiler(config.server),
			serviceworker: config.serviceworker && new WebpackCompiler(config.serviceworker)
		};
	}

	// this shouldn't be possible...
	throw new Error(`Invalid bundler option '${bundler}'`);
}

async function validate_config(cwd, config: any, bundler: 'rollup' | 'webpack') {
	if (!config.client || !config.server) {
		const extname = await get_config_extname(cwd);
		throw new Error(`${bundler}.config.${extname} must export a { client, server, serviceworker? } object`);
	}
}

function normalize_rollup_config(config: any) {
	if (typeof config.input === 'string') {
		config.input = path.normalize(config.input);
	} else {
		for (const name in config.input) {
			config.input[name] = path.normalize(config.input[name]);
		}
	}
}

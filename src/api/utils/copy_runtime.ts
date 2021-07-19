import { readFile, writeFile } from 'fs/promises';
import * as path from 'path';
import { mkdirp } from './fs_utils.js';

const runtime = await Promise.all(
	[
		'index.d.ts',
		'app.js',
		'server.js',
		'internal/shared.js',
		'internal/layout.svelte',
		'internal/error.svelte'
	].map(async file => ({
		file,
		source: await readFile(
			path.join(path.dirname(new URL(import.meta.url).pathname), `../../../runtime/${file}`),
			'utf-8'
		)
	}))
);

export async function copy_runtime(output: string) {
	await Promise.all(
		runtime.map(async ({ file, source }) => {
			mkdirp(path.dirname(`${output}/${file}`));
			await writeFile(`${output}/${file}`, source);
		})
	);
}

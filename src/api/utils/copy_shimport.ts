import * as fs from 'fs';
import { promisify } from 'util';
import { version as shimport_version } from 'shimport/package.json';
import { resolve } from 'import-meta-resolve';

export async function copy_shimport(dest: string) {
	await promisify(fs.writeFile)(
		`${dest}/client/shimport@${shimport_version}.js`,
		fs.readFileSync(
			new URL(await resolve('shimport/index.js', import.meta.url)).pathname
		)
	);
}

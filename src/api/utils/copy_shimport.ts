import { readFileSync } from 'fs';
import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'import-meta-resolve'
const shimport_version = JSON.parse(
	(await readFile(
		new URL(await resolve('shimport/package.json', import.meta.url)).pathname
	)).toString()
).version;

export async function copy_shimport(dest: string) {
	await writeFile(
		`${dest}/client/shimport@${shimport_version}.js`,
		readFileSync(
			new URL(await resolve('shimport/index.js', import.meta.url)).pathname
		)
	);
}

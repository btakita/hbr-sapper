// import { join } from 'path';
import relative from './require-relative.js';
import { CompileResult } from './interfaces.js';
import WebpackResult from './WebpackResult.js';

let webpack: any;

export class WebpackCompiler {
	_: any;

	constructor(config: any) {
		if (!webpack) webpack = relative('webpack', process.cwd());
		this._ = webpack(config);
	}

	oninvalid(cb: (filename: string) => void) {
		this._.hooks.invalid.tap('sapper.js', cb);
	}

	compile(): Promise<CompileResult> {
		return new Promise((fulfil, reject) => {
			this._.run((err: Error, stats: any) => {
				if (err) {
					reject(err);
					process.exit(1);
				}

				const result = new WebpackResult(stats);

				if (result.errors.length) {
					console.error(stats.toString({ colors: true }));
					reject(new Error('Encountered errors while building app'));
				} else {
					fulfil(result);
				}
			});
		});
	}

	watch(cb: (err?: Error, stats?: any) => void) {
		this._.watch({}, (err?: Error, stats?: any) => {
			cb(err, stats && new WebpackResult(stats));
		});
	}
}

// export class WebpackCompiler {
// 	constructor(private config: any) {}
// 	webpack_promise = new Promise<any>(async (resolve) => {
// 		const webpack = await import(join(process.cwd(), 'webpack'))
// 		resolve(webpack(this.config));
// 	});
//
// 	async oninvalid(cb: (filename: string) => void) {
// 		const _ = await this.webpack_promise;
// 		_.hooks.invalid.tap('sapper.js', cb);
// 	}
//
// 	async compile(): Promise<CompileResult> {
// 		const _ = await this.webpack_promise;
// 		return new Promise((fulfil, reject) => {
// 			_.run((err: Error, stats: any) => {
// 				if (err) {
// 					reject(err);
// 					process.exit(1);
// 				}
//
// 				const result = new WebpackResult(stats);
//
// 				if (result.errors.length) {
// 					console.error(stats.toString({ colors: true }));
// 					reject(new Error('Encountered errors while building app'));
// 				} else {
// 					fulfil(result);
// 				}
// 			});
// 		});
// 	}
//
// 	async watch(cb: (err?: Error, stats?: any) => void) {
// 		const _ = await this.webpack_promise;
// 		_.watch({}, (err?: Error, stats?: any) => {
// 			cb(err, stats && new WebpackResult(stats));
// 		});
// 	}
// }

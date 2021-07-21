// TODO: Use string-replace-async packages when https://github.com/dsblv/string-replace-async/issues/10 is resolved
/*
The MIT License (MIT)

Copyright (c) Dmitrii Sobolev <disobolev@icloud.com> (github.com/dsblv)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */
function replace_async(
	string: string,
	searchValue: { [Symbol.replace](string: string, replacer: (substring: string, ...args: any[]) => string): string; },
	replacer: (substring: string, ...args: any[]) => Promise<string>
): Promise<string> {
	try {
		if (typeof replacer === 'function') {
			// 1. Run fake pass of `replace`, collect values from `replacer` calls
			// 2. Resolve them with `Promise.all`
			// 3. Run `replace` with resolved values
			var values = []
			String.prototype.replace.call(string, searchValue, function () {
				values.push(replacer.apply(undefined, arguments))
				return ''
			})
			return Promise.all(values).then(function (resolvedValues) {
				return String.prototype.replace.call(string, searchValue, function () {
					return resolvedValues.shift()
				})
			})
		} else {
			return Promise.resolve(
				String.prototype.replace.call(string, searchValue, replacer)
			)
		}
	} catch (error) {
		return Promise.reject(error)
	}
}
export { replace_async }

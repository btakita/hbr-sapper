export function get_base_uri(window_document:Document) {
	let baseURI = window_document.baseURI
	if (!baseURI) {
		const baseTags = window_document.getElementsByTagName('base')
		baseURI = baseTags.length ? baseTags[0].href : window_document.URL
	}
	return baseURI
}
const file_regex = /^file:\/\//
export function is_hash_routing_(url:Location|URL):boolean {
	return !!(file_regex.test(url.origin) || (typeof window !== 'undefined' && (window as any).cordova))
}

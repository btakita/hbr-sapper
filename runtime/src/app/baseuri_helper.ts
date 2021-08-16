export function get_base_uri(window_document) {
	let baseURI = window_document.baseURI;

	if (!baseURI) {
		const baseTags = window_document.getElementsByTagName('base');
		baseURI = baseTags.length ? baseTags[0].href : window_document.URL;
	}

	return baseURI;
}
const http_regex = /^https?:\/\//
export function is_hash_routing_(url) {
  return !http_regex.test(url.origin)
}

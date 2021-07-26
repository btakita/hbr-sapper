import { base_url, cid, history, navigate, select_target } from '../router/index.js';
import { get_base_uri } from '../baseuri_helper.js';

export default function goto(
	href: string,
	opts: { noscroll?: boolean; replaceState?: boolean } = { noscroll: false, replaceState: false }
): Promise<void> {
	console.debug('goto|debug|1', JSON.stringify({
		base_url, 'get_base_uri(document)': get_base_uri(document), href, opts,
	}, null, 2))
	// const base_url = get_base_uri(document);
	let url = new URL(href, get_base_uri(document));
	console.debug('goto|debug|2', JSON.stringify({
		url, href, base_url
	}, null, 2))
	// if (url.origin === 'file://') {
	// 	href = `${base_url}#${url.href.replace(`${base_url}#`, '')}`;
	// 	url = new URL(href, base_url);
	// }
	const target = select_target(url);

	if (target) {
		const res = navigate(target, null, opts.noscroll);
		// file:// hash-based routing case: Convert local urls to hash urls
		href = url.origin === 'file://' ? `file://${base_url}#${url.pathname}${url.hash}` : href;
		console.debug('goto|debug|3', JSON.stringify({
			base_url, href, url, 'url.origin': url.origin, 'url.pathname': url.pathname, 'url.hash': url.hash
		}, null, 2))
		history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', href);
		return res;
	}

	location.href = href;
	return new Promise(() => {
		/* never resolves */
	});
}

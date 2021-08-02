import { base_url, cid, history, navigate, select_target } from '../router/index.js';
import { get_base_uri } from '../baseuri_helper.js';

export default function goto(
	href: string,
	opts: { noscroll?: boolean; replaceState?: boolean } = { noscroll: false, replaceState: false }
): Promise<void> {
	const url = new URL(href, get_base_uri(document));
	const target = select_target(url);

	if (target) {
		const res = navigate(target, null, opts.noscroll);
		// file:// hash-based routing case: Convert local urls to hash urls
		href = url.origin === 'file://' ? `file://${base_url}#${url.pathname}${url.hash}` : href;
		history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', href);
		return res;
	}

	location.href = href;
	return new Promise(() => {
		/* never resolves */
	});
}

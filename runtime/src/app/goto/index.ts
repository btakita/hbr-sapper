import { base_url, cid, history, navigate, select_target } from '../router/index.js';
import { get_base_uri } from '../baseuri_helper.js';

export default function goto(
	href: string,
	opts: { noscroll?: boolean; replaceState?: boolean } = { noscroll: false, replaceState: false }
): Promise<void> {
	if (!/\:\/\//.test(href) && href[0] !== '/') {
		href = `/${href}`;
	}
	const url =
		location.origin === 'file://'
		? new URL(`file://${base_url}#${href}`)
		:	new URL(href, get_base_uri(document));
	const target = select_target(url);

	if (target) {
		const res = navigate(target, null, opts.noscroll);
		history[opts.replaceState ? 'replaceState' : 'pushState']({ id: cid }, '', url.toString());
		return res;
	}

	location.href = href;
	return new Promise(() => {
		/* never resolves */
	});
}

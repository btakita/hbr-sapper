import {
	ScrollPosition,
	Target
} from '../types.js'
import {
	ignore,
	routes
} from '@sapper/internal/manifest-client.js'
import find_anchor from './find_anchor.js'
import { Page, Query } from '@sapper/common'
import { is_hash_routing_ } from '../baseuri_helper.js'
export { find_anchor }
export let uid = 1
export function set_uid(n:number) {
	uid = n
}
export let cid:number
export function set_cid(n:number) {
	cid = n
}
const _history:History = typeof history !== 'undefined' ? history : {
	pushState: ()=>{},
	replaceState: ()=>{},
	scrollRestoration: 'auto'
} as Partial<History> as any
export { _history as history }
export const scroll_history:Record<string, ScrollPosition> = {}
export let base_url:string
let handle_target:(dest:Target)=>Promise<void>
export function init(base:string, handler:(dest:Target)=>Promise<void>):void {
	base_url = base
	handle_target = handler
	if ('scrollRestoration' in _history) {
		_history.scrollRestoration = 'manual'
	}
	// Adopted from Nuxt.js
	// Reset scrollRestoration to auto when leaving page, allowing page reload
	// and back-navigation from other pages to use the browser to restore the
	// scrolling position.
	addEventListener('beforeunload', ()=>{
		_history.scrollRestoration = 'auto'
	})
	// Setting scrollRestoration to manual again when returning to this page.
	addEventListener('load', ()=>{
		_history.scrollRestoration = 'manual'
	})
	addEventListener('click', handle_click)
	addEventListener('popstate', handle_popstate)
}
export function load_current_page():Promise<void> {
	return Promise.resolve().then(()=>{
		const { href } = location
		// Use location href
		_history.replaceState({ id: uid }, '', href)
		const target = select_target(new URL(location.href))
		// Handle hash when hash-based routing
		const { hash } =
			is_hash_routing_(location)
			? new URL(`${location.protocol}//${base_url}${location.hash.slice(1)}`)
			: location
		if (target) return navigate(target, uid, true, hash)
	})
}
// IE11 does not support URLSearchParams so we'll fall back to a custom
// RegExp that mimics the standard URLSearchParams method
const _get_query_array = (search:string):string[][]=>{
	if (typeof URLSearchParams !== 'undefined') {
		return [...new URLSearchParams(search).entries()]
	}
	return search.slice(1).split('&').map(searchParam=>{
		// Instead of `.*` we'll use \s\S to allow characters and non characters
		// such as [\r\n\v\f]
		const [, key, value = ''] = /([^=]*)(?:=([\S\s]*))?/.exec(decodeURIComponent(searchParam.replace(/\+/g, ' ')))
		return [key, value]
	})
}
export function extract_query(search:string):Query {
	const query:Query = Object.create(null)
	return search.length ? _get_query_array(search).reduce(
		(query, [key, value])=>{
			if (typeof query[key] === 'string') query[key] = [<string>query[key]]
			if (typeof query[key] === 'object') (query[key] as string[]).push(value)
			else query[key] = value
			return query
		}, query) :
				 query
}
export function select_target(url:URL):Target {
	if (url.origin !== location.origin) return null
	const is_hash_routing = is_hash_routing_(url)
	if (!url.pathname.startsWith(base_url) && !is_hash_routing) return null
	let path = is_hash_routing
						 ? url.hash.slice(1).split('?')[0].split('#')[0]
						 : url.pathname.slice(base_url.length)
	if (path === '') {
		path = '/'
	}
	// avoid accidental clashes between server routes and page routes
	if (ignore.some(pattern=>pattern.test(path))) return
	for (let i = 0; i < routes.length; i += 1) {
		const route = routes[i]
		const match = route.pattern.exec(path)
		if (match) {
			const query = extract_query(url.search)
			const part = route.parts[route.parts.length - 1]
			const params = part.params ? part.params(match) : {}
			const page:Page = { host: location.host, path, query, params }
			return { href: path, route, match, page }
		}
	}
}
function handle_click(event:MouseEvent) {
	// Adapted from https://github.com/visionmedia/page.js
	// MIT license https://github.com/visionmedia/page.js#license
	if (which(event) !== 1) return
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
	if (event.defaultPrevented) return
	const a:HTMLAnchorElement|SVGAElement = <HTMLAnchorElement|SVGAElement>find_anchor(<Node>event.target)
	if (!a) return
	if (!a.href) return
	// check if link is inside an svg
	// in this case, both href and target are always inside an object
	const svg = typeof a.href === 'object' && a.href.constructor.name === 'SVGAnimatedString'
	const is_hash_routing = is_hash_routing_(location)
	let href:string
	if (svg) {
		href = String((<SVGAElement>a).href.baseVal)
	} else {
		if (is_hash_routing) {
			const href_attribute = a.getAttribute('href')
			href = `${location.origin}${base_url}#${
				(!/^[a-z]+\:\/\//.test(href_attribute) && href_attribute[0] !== '/')
				? `/${href_attribute}`
				: href_attribute
			}`
		} else {
			href = String(a.href)
		}
	}
	if (href === location.href) {
		if (is_hash_routing || !location.hash) event.preventDefault()
		return
	}
	// Ignore if tag has
	// 1. 'download' attribute
	// 2. rel='external' attribute
	if (a.hasAttribute('download') || a.getAttribute('rel') === 'external') return
	// Ignore if <a> has a target
	if (svg ? (<SVGAElement>a).target.baseVal : a.target) return
	const url = new URL(href)
	// Don't handle hash changes
	if (
		is_hash_routing
		? url.hash === location.hash
		: (url.pathname === location.pathname && url.search === location.search)
	) return
	const target = select_target(url)
	if (target) {
		const noscroll = a.hasAttribute('sapper:noscroll')
		// Always use hash from url. hash-based routing is abstracted away from <a href>
		navigate(target, null, noscroll, url.hash)
		event.preventDefault()
		// Handle hash-based routing
		const href =
			is_hash_routing_(url)
			? `${url.protocol}//${url.pathname}${url.search}${url.hash}`
			: url.href
		_history.pushState({ id: cid }, '', href)
	}
}
function which(event:MouseEvent) {
	return event.which === null ? event.button : event.which
}
function scroll_state() {
	return {
		x: pageXOffset,
		y: pageYOffset
	}
}
function handle_popstate(event:PopStateEvent) {
	scroll_history[cid] = scroll_state()
	if (event.state) {
		const url = new URL(location.href)
		const target = select_target(url)
		if (target) {
			navigate(target, event.state.id)
		} else {
			// eslint-disable-next-line
			location.href = location.href // nosonar
		}
	} else {
		// hashchange
		set_uid(uid + 1)
		set_cid(uid)
		_history.replaceState({ id: cid }, '', location.href)
	}
}
export async function navigate(dest:Target, id:number, noscroll?:boolean, hash?:string):Promise<void> {
	const popstate = !!id
	if (popstate) {
		cid = id
	} else {
		const current_scroll = scroll_state()
		// clicked on a link. preserve scroll state
		scroll_history[cid] = current_scroll
		cid = id = ++uid
		scroll_history[cid] = noscroll ? current_scroll : { x: 0, y: 0 }
	}
	await handle_target(dest)
	if (document.activeElement && (document.activeElement instanceof HTMLElement)) document.activeElement.blur()
	if (!noscroll) {
		let scroll = scroll_history[id]
		let deep_linked
		if (hash) {
			// scroll is an element id (from a hash), we need to compute y.
			deep_linked = document.getElementById(hash.slice(1))
			if (deep_linked) {
				scroll = {
					x: 0,
					y: deep_linked.getBoundingClientRect().top + scrollY
				}
			}
		}
		scroll_history[cid] = scroll
		if (scroll && (popstate || deep_linked)) {
			scrollTo(scroll.x, scroll.y)
		} else {
			scrollTo(0, 0)
		}
	}
}
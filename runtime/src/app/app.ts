import { Timeout } from '@ctx-core/function'
import type { Branch, HydratedTarget, InitialData, Page, Redirect, Target } from '@sapper/app-lib'
import {
	extract_query,
	find_anchor,
	get_base_uri,
	goto,
	init as init_router,
	load_current_page,
	select_target
} from '@sapper/app-lib'
import { type PageContext } from '@sapper/common'
import App from '@sapper/internal/App.svelte'
import { components } from '@sapper/internal/manifest-client.js'
import { ErrorComponent, root_comp } from '@sapper/internal/app-manifest-client.js'
import { writable } from 'svelte/store'
import { page_store } from './stores/index.js'
declare const __SAPPER__
export const initial_data:InitialData = typeof __SAPPER__ !== 'undefined' && __SAPPER__
let ready = false
let root_component:InstanceType<typeof App>
let current_token:{}
let root_preloaded:object|Promise<object>
let current_branch:Branch = []
let current_query = '{}'
const stores = {
	page: page_store({}),
	preloading: writable(null),
	session: writable(initial_data && initial_data.session)
}
let $session:any
let session_dirty:boolean
stores.session.subscribe(async value=>{
	$session = value
	if (!ready) return
	session_dirty = true
	const dest = select_target(new URL(location.href))
	const token = current_token = {}
	const { redirect, props, branch } = await hydrate_target(dest)
	if (token !== current_token) return // a secondary navigation happened while we were loading
	if (redirect) {
		await goto(redirect.location, { replaceState: true })
	} else {
		await render(branch, props, buildPageContext(props, dest.page))
	}
})
export let target:Node
export function set_target(node:Node) {
	target = node
}
export function start(opts:{
	target:Node
}):Promise<void> {
	set_target(opts.target)
	init_router(initial_data.baseUrl, handle_target)
	start_prefetching()
	if (initial_data.error) {
		return Promise.resolve().then(()=>handle_error())
	}
	return load_current_page()
}
async function handle_error() {
	const { host, pathname, search } = location
	const { session, preloaded, status, error } = initial_data
	if (!root_preloaded) {
		root_preloaded = preloaded && preloaded[0]
	}
	const props = {
		error,
		status,
		session,
		level0: {
			props: root_preloaded
		},
		level1: {
			props: {
				status,
				error
			},
			component: ErrorComponent
		},
		segments: preloaded
	}
	const query = extract_query(search)
	render([], props, { host, path: pathname, query, params: {}, error })
}
function buildPageContext(props:any, page:Page):PageContext {
	const { error } = props
	return { error, ...page }
}
async function handle_target(dest:Target):Promise<void> {
	if (root_component) stores.preloading.set(true)
	const hydrating = get_prefetched(dest)
	const token = current_token = {}
	const hydrated_target = await hydrating
	const { redirect } = hydrated_target
	if (token !== current_token) return // a secondary navigation happened while we were loading
	if (redirect) {
		await goto(redirect.location, { replaceState: true })
	} else {
		const { props, branch } = hydrated_target
		await render(branch, props, buildPageContext(props, dest.page))
	}
}
async function render(branch:Branch, props:any, page:PageContext) {
	stores.page.set(page)
	stores.preloading.set(false)
	if (root_component) {
		root_component.$set(props)
	} else {
		props.stores = {
			page: { subscribe: stores.page.subscribe },
			preloading: { subscribe: stores.preloading.subscribe },
			session: stores.session
		}
		props.level0 = {
			props: await root_preloaded
		}
		props.notify = stores.page.notify
		root_component = new App({
			target,
			props,
			hydrate: true
		})
	}
	current_branch = branch
	current_query = JSON.stringify(page.query)
	ready = true
	session_dirty = false
}
function part_changed(i, segment, match, stringified_query) {
	// TODO only check query string changes for preload functions
	// that do in fact depend on it (using static analysis or
	// runtime instrumentation)
	if (stringified_query !== current_query) return true
	const previous = current_branch[i]
	if (!previous) return false
	if (segment !== previous.segment) return true
	if (previous.match) {
		if (JSON.stringify(previous.match.slice(1, i + 2)) !== JSON.stringify(match.slice(1, i + 2))) {
			return true
		}
	}
}
export async function hydrate_target(dest:Target):Promise<HydratedTarget> {
	const { route, page } = dest
	const segments = page.path.split('/').filter(Boolean)
	let redirect:Redirect = null
	const props = { error: null, status: 200, segments: [segments[0]] }
	const preload_context = {
		fetch: (url:string, opts?:any)=>fetch(url, opts),
		redirect: (statusCode:number, location:string)=>{
			if (redirect && (redirect.statusCode !== statusCode || redirect.location !== location)) {
				throw new Error('Conflicting redirects')
			}
			redirect = { statusCode, location }
		},
		error: (status:number, error:Error|string)=>{
			props.error = typeof error === 'string' ? new Error(error) : error
			props.status = status
		}
	}
	if (!root_preloaded) {
		const root_preload = root_comp.preload || (()=>({}))
		root_preloaded = initial_data.preloaded[0] || root_preload.call(preload_context, {
			host: page.host,
			path: page.path,
			query: page.query,
			params: {}
		}, $session)
	}
	let branch:Branch
	let l = 1
	try {
		const stringified_query = JSON.stringify(page.query)
		const match = route.pattern.exec(page.path)
		let segment_dirty = false
		const component_result_js_a = await Promise.all(route.parts.map(async (part, i)=>{
			const segment = segments[i]
			if (part_changed(i, segment, match, stringified_query)) segment_dirty = true
			props.segments[l] = segments[i + 1] // TODO make this less confusing
			if (!part) return { segment }
			if (!session_dirty && !segment_dirty && current_branch[i] && current_branch[i].part === part.i) {
				return { part, result: current_branch[i] }
			} else {
				segment_dirty = false
				const { default: component, preload } = await components[part.i].js()
				return { component, preload, part }
			}
		}))
		l = 1
		branch = await Promise.all(component_result_js_a.map(async (component_result_js, i)=>{
			const segment = segments[i]
			if (!component_result_js.part) {
				return { segment }
			}
			const j = l++
			let { result } = component_result_js
			if (!result) {
				const { component, preload, part } = component_result_js
				let preloaded:object
				if (ready || !initial_data.preloaded[i + 1]) {
					preloaded = preload
											? await preload.call(preload_context, {
							host: page.host,
							path: page.path,
							query: page.query,
							params: part.params ? part.params(dest.match) : {}
						}, $session)
											: {}
				} else {
					preloaded = initial_data.preloaded[i + 1]
				}
				result = { component, props: preloaded, segment, match, part: part.i }
			}
			return (props[`level${j}`] = result)
		}))
	} catch (error) {
		props.error = error
		props.status = 500
		branch = []
	}
	return { redirect, props, branch }
}
let prefetching:{
	href:string;
	promise:Promise<HydratedTarget>;
} = null
let mousemove_timeout:Timeout
export function start_prefetching() {
	addEventListener('touchstart', trigger_prefetch)
	addEventListener('mousemove', handle_mousemove)
}
export function prefetch(href:string) {
	const target = select_target(new URL(href, get_base_uri(document)))
	if (target) {
		if (!prefetching || href !== prefetching.href) {
			prefetching = { href, promise: hydrate_target(target) }
		}
		return prefetching.promise
	}
}
export function get_prefetched(target:Target):Promise<HydratedTarget> {
	if (prefetching && prefetching.href === target.href) {
		return prefetching.promise
	} else {
		return hydrate_target(target)
	}
}
function trigger_prefetch(event:MouseEvent|TouchEvent) {
	const a:HTMLAnchorElement = <HTMLAnchorElement>find_anchor(<Node>event.target)
	if (a && a.hasAttribute('sapper:prefetch')) {
		// Same path processing as select_target
		prefetch(a.href === '' ? '/' : a.href)
	}
}
function handle_mousemove(event:MouseEvent) {
	clearTimeout(mousemove_timeout)
	mousemove_timeout = setTimeout(()=>{
		trigger_prefetch(event)
	}, 20)
}

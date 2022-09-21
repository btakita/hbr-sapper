<script>
	import { stores } from '@sapper/app-lib';
	const { page } = stores();
</script>

<h1>{$page.host.replace(/:\d+$/, '')}</h1>

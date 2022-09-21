<script>
	import { stores } from '@sapper/app-lib';
	const { page } = stores();
</script>

<h1>{JSON.stringify($page.query)}</h1>

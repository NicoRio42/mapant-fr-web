<script lang="ts">
	import { enhance } from '$app/forms';

	export let isUserConnected: boolean;
</script>

<li py-0 flex list-none>
	<a href="/about" flex items-center gap-2 py-0>
		<i i-carbon-information block w5 h5></i>

		Infos
	</a>
</li>

{#if !isUserConnected}
	<li py-0 flex list-none>
		<a href="/login" flex items-center gap-2 py-0>
			<i i-carbon-login block w5 h5></i>

			Login
		</a>
	</li>
{:else}
	<li py-0 flex list-none>
		<form action="/logout" method="post" use:enhance>
			<button type="submit" flex items-center gap-2 p="x-0 y-1" mb-0 border-none class="outline">
				<i i-carbon-logout block w5 h5></i>

				Logout
			</button>
		</form>
	</li>
{/if}

<li py-0 flex list-none>
	<a href="/blog" flex items-center gap-2 py-0>
		<i i-carbon-blog block w5 h5></i>

		Blog
	</a>
</li>

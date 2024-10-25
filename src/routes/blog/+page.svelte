<script>
	import { page } from '$app/stores';
	import { WEBSITE_NAME } from '$lib/constants';
	import { MetaTags } from 'svelte-meta-tags';

	let { data } = $props();

	const dateFormater = new Intl.DateTimeFormat('fr', { dateStyle: 'short' });
</script>

<MetaTags
	title="{WEBSITE_NAME} | Blog"
	description="Article de blog du site mapant.fr"
	canonical={new URL($page.url.pathname, $page.url.origin).href}
	twitter={{ cardType: 'summary_large_image' }}
/>

<main container max-w-200 m-x-auto py-8 px-4>
	<h1 mb-8>Blog</h1>

	{#each data.posts as post (post.slug)}
		<a href="/blog/{post.slug}" contents>
			<article p-0 mt-8 class="group">
				<div relative>
					<img
						src={post.frontmatter.banner}
						alt=""
						decoding="async"
						w-full
						h-50
						object-cover
						style:--view-transition-name="title-{post.slug}"
						class="[view-transition-name:var(--view-transition-name)]"
					/>

					<h2
						text="6 white"
						absolute
						right-0
						bottom-0
						left-0
						bg-gray-800
						bg-op-50
						p-4
						mb-0
						style:--view-transition-name="banner-{post.slug}"
						class="[view-transition-name:var(--view-transition-name)]"
					>
						{post.frontmatter.title}
					</h2>
				</div>

				<section p-6>
					<p text="h1-color left">{post.frontmatter.description}</p>

					<div flex items-end>
						<div grow>
							<p text-h1-color flex items-center gap-2 mb-0>
								<i i-carbon-calendar inline-block w-5 h-5></i>

								{dateFormater.format(new Date(post.frontmatter.date))}
							</p>

							<p text-h1-color flex items-center gap-2 mb-0>
								<i i-carbon-pen inline-block w-5 h-5></i>

								{post.frontmatter.author}
							</p>
						</div>

						<p m-0 flex items-center gap-2 class="group-hover:underline">
							Lire

							<i i-carbon-arrow-right inline-block w-5 h-5></i>
						</p>
					</div>
				</section>
			</article>
		</a>
	{/each}
</main>

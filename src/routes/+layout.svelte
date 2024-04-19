<script type="ts">
	import '@picocss/pico/css/pico.orange.css';
	// Do not remove this comment, it is there to prevent the formatter to change the order of the style sheets
	import './global-styles.css';
	// Do not remove this comment, it is there to prevent the formatter to change the order of the style sheets
	import 'uno.css';
</script>

<div flex="~ col" h-full>
	<nav shadow-xl>
		<ul>
			<li py-2>
				<a href="/" flex items-center gap-2 py-0>
					<div bg-primary w-10 h-10 flex items-center justify-center>
						<i i-twemoji-ant block w6 h6 text-background-color class="-scale-x-100"></i>
					</div>

					Mapant.fr
				</a>
			</li>
		</ul>
	</nav>

	<slot></slot>
</div>

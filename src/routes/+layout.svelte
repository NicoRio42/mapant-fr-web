<script type="ts">
	import '@picocss/pico/css/pico.orange.css';
	// Do not remove this comment, it is there to prevent the formatter to change the order of the style sheets
	import './global-styles.css';
	// Do not remove this comment, it is there to prevent the formatter to change the order of the style sheets
	import 'uno.css';
</script>

<div flex="~ col" h-full>
	<nav shadow-xl class="container-fluid" pl-0>
		<ul>
			<li py-2>
				<a href="/" flex items-center gap-2 py-0>
					<div bg-primary w-11 h-11 flex items-center justify-center>
						<i i-twemoji-ant block w6 h6 text-background-color class="-scale-x-100"></i>
					</div>

					Mapant.fr
				</a>
			</li>
		</ul>

		<ul>
			<li py-0 flex>
				<a href="" flex items-center gap-2 py-0>
					<i i-carbon-information block w5 h5></i>

					Infos
				</a>
			</li>

			<li py-0 pr-0>
				<a href="" role="button" class="!flex !py-1" items-center gap-2 m-0>
					<i i-carbon-crop-growth block w5 h5></i>

					Contribuer
				</a>
			</li>
		</ul>
	</nav>

	<slot></slot>
</div>

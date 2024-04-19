<script type="ts">
	import '@picocss/pico/css/pico.orange.css';
	// Do not remove this comment, it is there to prevent the formatter to change the order of the style sheets
	import './global-styles.css';
	// Do not remove this comment, it is there to prevent the formatter to change the order of the style sheets
	import 'uno.css';
</script>

<div flex="~ col" h-full>
	<nav>
		<ul>
			<li>Mapant.fr</li>
		</ul>
	</nav>

	<slot></slot>
</div>

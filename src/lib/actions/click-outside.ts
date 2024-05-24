const CLICK_THRESHOLD = 3;

export function clickOutside(element: HTMLElement, callback: Function) {
	let coords: [number, number] | null = null;

	function onMouseDown(event: MouseEvent) {
		coords = null;
		if (event.target !== null && element.contains(event.target as Node)) return;
		coords = [event.pageX, event.pageY];
	}

	function onMouseUp(event: MouseEvent) {
		if (
			coords === null ||
			Math.abs(coords[0] - event.pageX) > CLICK_THRESHOLD ||
			Math.abs(coords[1] - event.pageY) > CLICK_THRESHOLD
		) {
			return;
		}

		callback();
	}

	addEventListener('mousedown', onMouseDown);
	addEventListener('mouseup', onMouseUp);

	return {
		destroy: () => removeEventListener('click', onMouseUp)
	};
}

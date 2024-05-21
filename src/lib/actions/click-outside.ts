export function clickOutside(element: HTMLElement, callback: Function) {
	function handler({ target }: MouseEvent) {
		if (target !== null && element.contains(target as Node)) return;
		callback();
	}

	addEventListener('click', handler);

	return {
		destroy: () => removeEventListener('click', handler)
	};
}

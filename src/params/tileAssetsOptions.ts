import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((
	param: string
): param is 'rasters' | 'shapefiles' | 'pngs' | 'full-map' | 'lidar' => {
	return (
		param === 'rasters' ||
		param === 'shapefiles' ||
		param === 'pngs' ||
		param === 'full-map' ||
		param === 'lidar'
	);
}) satisfies ParamMatcher;

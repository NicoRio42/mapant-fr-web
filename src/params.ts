import { defineParams } from '@sveltejs/kit/params';

const matchRenderStepOptions = (
	param: string
): param is 'rasters' | 'shapefiles' | 'pngs' | 'full-map' => {
	return param === 'rasters' || param === 'shapefiles' || param === 'pngs' || param === 'full-map';
};

const matchTileAssetsOptions = (
	param: string
): param is 'rasters' | 'shapefiles' | 'pngs' | 'full-map' => {
	return param === 'rasters' || param === 'shapefiles' || param === 'pngs' || param === 'full-map';
};

export const params = defineParams({
	renderStepOptions: (param) => (matchRenderStepOptions(param) ? param : undefined),
	tileAssetsOptions: (param) => (matchTileAssetsOptions(param) ? param : undefined)
});

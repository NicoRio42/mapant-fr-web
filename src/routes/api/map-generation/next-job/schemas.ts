import z from 'zod';

export const lidarJobSchema = z.object({
	type: z.literal('lidar'),
	data: z.object({
		tileId: z.string(),
		tileUrl: z.string().url()
	})
});

export type LidarJob = z.infer<typeof lidarJobSchema>;

export const renderJobSchema = z.object({
	type: z.literal('render'),
	data: z.object({
		tileId: z.string(),
		neigbhoringTilesIds: z.array(z.string())
	})
});

export type RenderJob = z.infer<typeof renderJobSchema>;

export const pyramidJobSchema = z.object({
	type: z.literal('pyramid'),
	data: z.object({
		x: z.number(),
		y: z.number(),
		z: z.number(),
		baseZoomLevelTileId: z.string().nullable(),
		areaId: z.string()
	})
});

export type PyramidJob = z.infer<typeof pyramidJobSchema>;

export const noJobSchema = z.object({
	type: z.literal('noJobLeft')
});

export type NoJob = z.infer<typeof noJobSchema>;

export const nextJobApiEndpointResponseSchema = z.union([
	lidarJobSchema,
	renderJobSchema,
	pyramidJobSchema,
	noJobSchema
]);

export type NextJobApiEndpointResponse = z.infer<typeof nextJobApiEndpointResponseSchema>;

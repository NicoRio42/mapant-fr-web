import z from 'zod';

export const lidarJobSchema = z.object({
	type: z.literal('Lidar'),
	data: z.object({
		tile_id: z.string(),
		tile_url: z.string().url()
	})
});

export type LidarJob = z.infer<typeof lidarJobSchema>;

export const renderJobSchema = z.object({
	type: z.literal('Render'),
	data: z.object({
		tile_id: z.string(),
		neigbhoring_tiles_ids: z.array(z.string())
	})
});

export type RenderJob = z.infer<typeof renderJobSchema>;

export const pyramidJobSchema = z.object({
	type: z.literal('Pyramid'),
	data: z.object({
		x: z.number(),
		y: z.number(),
		z: z.number()
	})
});

export type PyramidJob = z.infer<typeof pyramidJobSchema>;

export const noJobSchema = z.object({
	type: z.literal('NoJobLeft')
});

export type NoJob = z.infer<typeof noJobSchema>;

export const nextJobApiEndpointResponseSchema = z.union([
	lidarJobSchema,
	renderJobSchema,
	pyramidJobSchema,
	noJobSchema
]);

export type NextJobApiEndpointResponse = z.infer<typeof nextJobApiEndpointResponseSchema>;

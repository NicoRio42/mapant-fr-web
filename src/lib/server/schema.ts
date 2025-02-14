import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { generateId } from 'lucia';

const id = text('id')
	.primaryKey()
	.notNull()
	.$defaultFn(() => generateId(15));

export const contributionTable = sqliteTable(
	'contribution',
	{
		id,
		fkUser: text('fk_user').references(() => userTable.id, { onDelete: 'set null' }),
		formula: text('formula', { enum: ['1', '2', '3', '4', '5'] }).notNull(),
		minX: real('min_x').notNull(),
		minY: real('min_y').notNull(),
		maxX: real('max_x').notNull(),
		maxY: real('max_y').notNull(),
		paied: integer('paied', { mode: 'boolean' }).default(false),
		processed: integer('processed', { mode: 'boolean' }).default(false)
	},
	(table) => ({
		fkUserIndex: index('contribution_fk_user').on(table.fkUser)
	})
);

export type Contribution = typeof contributionTable.$inferSelect;

export const contributionWithoutCompensationTable = sqliteTable(
	'contribution_without_compensation',
	{
		id,
		fkUser: text('fk_user').references(() => userTable.id, { onDelete: 'set null' }),
		formula: text('formula', { enum: ['1', '2', '3', '4', '5'] }).notNull(),
		paied: integer('paied', { mode: 'boolean' }).default(false)
	},
	(table) => ({
		fkUserIndex: index('contribution_without_compensation_fk_user').on(table.fkUser)
	})
);

export const tilesTable = sqliteTable('tiles', {
	id,
	minX: real('min_x').notNull(),
	minY: real('min_y').notNull(),
	maxX: real('max_x').notNull(),
	maxY: real('max_y').notNull(),
	lidarFileUrl: text('lidar_file_url').notNull(),
	lidarStepStatus: text('lidar_step_status', { enum: ['not-started', 'ongoing', 'finished'] })
		.default('not-started')
		.notNull(),
	lidarStepWorkerId: text('lidar_step_worker_id').references(() => workersTable.id, {
		onDelete: 'set null'
	}),
	lidarStepStartTime: integer('lidar_step_start_time', { mode: 'timestamp_ms' }),
	lidarStepFinishTime: integer('lidar_step_finish_time', { mode: 'timestamp_ms' }),
	mapRenderingStepStatus: text('map_rendering_step_status', {
		enum: ['not-started', 'ongoing', 'finished']
	})
		.default('not-started')
		.notNull(),
	mapRenderingStepWorkerId: text('map_rendering_step_worker_id').references(() => workersTable.id, {
		onDelete: 'set null'
	}),
	mapRenderingStepStartTime: integer('map_rendering_step_start_time', { mode: 'timestamp_ms' }),
	mapRenderingStepFinishTime: integer('map_rendering_step_finish_time', { mode: 'timestamp_ms' }),
	isMergeable: integer('is_mergeable', { mode: 'boolean' }).default(false)
});

export const tilesTableRelations = relations(tilesTable, ({ one }) => ({
	lidarJob: one(lidarStepJobTable, {
		fields: [tilesTable.id],
		references: [lidarStepJobTable.tileId]
	})
}));

export type Tile = typeof tilesTable.$inferSelect;
export type TileInsert = typeof tilesTable.$inferInsert;

export const areasToGenerateTable = sqliteTable('areas_to_generate', {
	id,
	minX: real('min_x').notNull(),
	minY: real('min_y').notNull(),
	maxX: real('max_x').notNull(),
	maxY: real('max_y').notNull(),
	pyramidGenerationStepStatus: text('pyramid_generation_step_status', {
		enum: ['not-started', 'ongoing', 'finished']
	})
		.default('not-started')
		.notNull(),
	isMergeable: integer('is_mergeable', { mode: 'boolean' }).default(false)
});

export const areasToGenerateTableRelations = relations(areasToGenerateTable, ({ many }) => ({
	lidarJobs: many(lidarStepJobTable)
}));

export type AreaToGenerate = typeof areasToGenerateTable.$inferSelect;

export const lidarStepJobTable = sqliteTable(
	'lidar_step_jobs',
	{
		id,
		index: integer('index').notNull(),
		tileId: text('tile_id')
			.notNull()
			.references(() => tilesTable.id, { onDelete: 'cascade' }),
		areaToGenerateId: text('area_to_generate_id')
			.notNull()
			.references(() => areasToGenerateTable.id, { onDelete: 'cascade' })
	},
	(table) => ({
		tileIdIndex: index('lidar_step_jobs_tile_id_index').on(table.tileId),
		areaToGenerateIdIndex: index('lidar_step_jobs_area_to_generate_id_index').on(
			table.areaToGenerateId
		)
	})
);

export const lidarStepJobTableRelations = relations(lidarStepJobTable, ({ one }) => ({
	area: one(areasToGenerateTable, {
		fields: [lidarStepJobTable.areaToGenerateId],
		references: [areasToGenerateTable.id]
	}),
	tile: one(tilesTable, {
		fields: [lidarStepJobTable.tileId],
		references: [tilesTable.id]
	})
}));

export const mapRenderingStepJobTable = sqliteTable(
	'map_rendering_step_jobs',
	{
		id,
		index: integer('index').notNull(),
		tileId: text('tile_id')
			.notNull()
			.references(() => tilesTable.id, { onDelete: 'cascade' }),
		areaToGenerateId: text('area_to_generate_id')
			.notNull()
			.references(() => areasToGenerateTable.id, { onDelete: 'cascade' })
	},
	(table) => ({
		tileIdIndex: index('map_rendering_step_jobs_tile_id_index').on(table.tileId),
		areaToGenerateIdIndex: index('map_rendering_step_jobs_area_to_generate_id_index').on(
			table.areaToGenerateId
		)
	})
);

export const pyramidRenderingStepJobTable = sqliteTable(
	'pyramid_rendering_step_jobs',
	{
		id,
		index: integer('index').notNull(),
		areaToGenerateId: text('area_to_generate_id')
			.notNull()
			.references(() => areasToGenerateTable.id, { onDelete: 'cascade' }),
		x: integer('x').notNull(),
		y: integer('y').notNull(),
		zoom: integer('zoom').notNull(),
		baseZoomLevelTileId: text('base_zoom_level_tile_id').references(() => tilesTable.id, {
			onDelete: 'cascade'
		}),
		status: text('status', { enum: ['not-started', 'ongoing', 'finished'] })
			.default('not-started')
			.notNull(),
		workerId: text('worker_id').references(() => workersTable.id, {
			onDelete: 'set null'
		}),
		startTime: integer('start_time', { mode: 'timestamp_ms' }),
		finishTime: integer('finish_time', { mode: 'timestamp_ms' })
	},
	(table) => ({
		areaToGenerateIdIndex: index('pyramid_rendering_step_jobs_area_to_generate_id_index').on(
			table.areaToGenerateId
		)
	})
);

export const workersTable = sqliteTable('workers', {
	id,
	name: text('name').unique().notNull(),
	hashedApiKey: text('hashed_api_key')
});

export type MapantWorker = typeof workersTable.$inferSelect;

export const userTable = sqliteTable('user', {
	id,
	email: text('email').notNull(),
	hashedPassword: text('hashed_password').notNull(),
	allowedSendingEmail: integer('allowed_sending_email', { mode: 'boolean' }).notNull()
});

export type User = typeof userTable.$inferSelect;

export const sessionTable = sqliteTable(
	'user_session',
	{
		id: text('id').primaryKey().notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		expiresAt: integer('expires_at').notNull()
	},
	(table) => ({
		userIdIndex: index('user_session_user_id_index').on(table.userId)
	})
);

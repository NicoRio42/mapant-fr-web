import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { generateId } from 'lucia';

const id = text('id')
	.primaryKey()
	.notNull()
	.$defaultFn(() => generateId(15));

export const contributionTable = sqliteTable('contribution', {
	id,
	fkUser: text('fk_user')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	formula: text('formula', { enum: ['1', '2', '3', '4', '5'] }).notNull(),
	minX: real('min_x').notNull(),
	minY: real('min_y').notNull(),
	maxX: real('max_x').notNull(),
	maxY: real('max_y').notNull(),
	paied: integer('paied', { mode: 'boolean' }).default(false),
	processed: integer('processed', { mode: 'boolean' }).default(false)
});

export type Contribution = typeof contributionTable.$inferSelect;

export const contributionWithoutCompensationTable = sqliteTable(
	'contribution_without_compensation',
	{
		id,
		fkUser: text('fk_user')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		formula: text('formula', { enum: ['1', '2', '3', '4', '5'] }).notNull(),
		paied: integer('paied', { mode: 'boolean' }).default(false)
	}
);

export const tilesTable = sqliteTable('tiles', {
	id,
	minX: real().notNull(),
	minY: real().notNull(),
	maxX: real().notNull(),
	maxY: real().notNull(),
	lidarFileUrl: text().notNull(),
	lidarStepStatus: text({ enum: ['not-started', 'ongoing', 'finished'] })
		.default('not-started')
		.notNull(),
	lidarStepWorkerId: text().references(() => workersTable.id, {
		onDelete: 'set null'
	}),
	mapRenderingStepStatus: text({ enum: ['not-started', 'ongoing', 'finished'] })
		.default('not-started')
		.notNull(),
	mapRenderingStepWorkerId: text().references(() => workersTable.id, {
		onDelete: 'set null'
	})
});

export type TileInsert = typeof tilesTable.$inferInsert;

export const areasToGenerateTable = sqliteTable('areas_to_generate', {
	id,
	minX: real().notNull(),
	minY: real().notNull(),
	maxX: real().notNull(),
	maxY: real().notNull(),
	pyramidGenerationStepStatus: text({ enum: ['not-started', 'ongoing', 'finished'] })
		.default('not-started')
		.notNull(),
	pyramidGenerationStepWorkerId: text().references(() => workersTable.id, {
		onDelete: 'set null'
	})
});

export type AreaToGenerate = typeof areasToGenerateTable.$inferSelect;

export const lidarStepJobTable = sqliteTable('lidar_step_jobs', {
	id,
	tileId: text()
		.notNull()
		.references(() => tilesTable.id, { onDelete: 'cascade' }),
	areaToGenerateId: text()
		.notNull()
		.references(() => areasToGenerateTable.id, { onDelete: 'cascade' })
});

export const mapRenderingStepJobTable = sqliteTable('map_rendering_step_jobs', {
	id,
	tileId: text()
		.notNull()
		.references(() => tilesTable.id, { onDelete: 'cascade' }),
	areaToGenerateId: text()
		.notNull()
		.references(() => areasToGenerateTable.id, { onDelete: 'cascade' })
});

export const workersTable = sqliteTable('workers', {
	id,
	name: text().unique().notNull(),
	hashedApiKey: text()
});

export const userTable = sqliteTable('user', {
	id,
	email: text('email').notNull(),
	hashedPassword: text('hashed_password').notNull(),
	allowedSendingEmail: integer('allowed_sending_email', { mode: 'boolean' }).notNull()
});

export type User = typeof userTable.$inferSelect;

export const sessionTable = sqliteTable('user_session', {
	id: text('id').primaryKey().notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at').notNull()
});

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
	formula: text('formula', { enum: ['1', '2', '3', '4'] }).notNull(),
	minX: real('min_x').notNull(),
	minY: real('min_y').notNull(),
	maxX: real('max_x').notNull(),
	maxY: real('max_y').notNull(),
	paied: integer('paied', { mode: 'boolean' }).default(false),
	processed: integer('processed', { mode: 'boolean' }).default(false)
});

export type Contribution = typeof contributionTable.$inferSelect;

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

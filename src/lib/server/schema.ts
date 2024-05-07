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
	formula: text('hashed_password', { enum: ['1', '2', '3', '4'] }).notNull(),
	topLeftX: real('top_left_x').notNull(),
	topLeftY: real('top_left_y').notNull(),
	topRightX: real('top_right_x').notNull(),
	topRightY: real('top_right_y').notNull(),
	bottomRightX: real('bottom_right_x').notNull(),
	bottomRightY: real('bottom_right_y').notNull(),
	bottomLeftX: real('bottom_left_x').notNull(),
	bottomLeftY: real('bottom_left_y').notNull(),
	paied: integer('paied', { mode: 'boolean' }).default(false)
});

export const userTable = sqliteTable('user', {
	id,
	username: text('username').notNull(),
	email: text('email').notNull(),
	hashedPassword: text('hashed_password').notNull()
});

export type User = typeof userTable.$inferSelect;

export const sessionTable = sqliteTable('user_session', {
	id: text('id').primaryKey().notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at').notNull()
});

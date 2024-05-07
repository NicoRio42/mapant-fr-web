CREATE TABLE `contribution` (
	`id` text PRIMARY KEY NOT NULL,
	`fk_user` text NOT NULL,
	`hashed_password` text NOT NULL,
	`top_left_x` real NOT NULL,
	`top_left_y` real NOT NULL,
	`top_right_x` real NOT NULL,
	`top_right_y` real NOT NULL,
	`bottom_right_x` real NOT NULL,
	`bottom_right_y` real NOT NULL,
	`bottom_left_x` real NOT NULL,
	`bottom_left_y` real NOT NULL,
	`paied` integer DEFAULT false,
	FOREIGN KEY (`fk_user`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`hashed_password` text NOT NULL
);

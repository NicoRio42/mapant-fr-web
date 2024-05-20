CREATE TABLE `contribution` (
	`id` text PRIMARY KEY NOT NULL,
	`fk_user` text NOT NULL,
	`formula` text NOT NULL,
	`min_x` real NOT NULL,
	`min_y` real NOT NULL,
	`max_x` real NOT NULL,
	`max_y` real NOT NULL,
	`paied` integer DEFAULT false,
	`processed` integer DEFAULT false,
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
	`email` text NOT NULL,
	`hashed_password` text NOT NULL,
	`allowed_sending_email` integer NOT NULL
);

CREATE TABLE `contribution_without_compensation` (
	`id` text PRIMARY KEY NOT NULL,
	`fk_user` text NOT NULL,
	`formula` text NOT NULL,
	`paied` integer DEFAULT false,
	FOREIGN KEY (`fk_user`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

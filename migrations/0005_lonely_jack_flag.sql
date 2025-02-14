PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_contribution` (
	`id` text PRIMARY KEY NOT NULL,
	`fk_user` text,
	`formula` text NOT NULL,
	`min_x` real NOT NULL,
	`min_y` real NOT NULL,
	`max_x` real NOT NULL,
	`max_y` real NOT NULL,
	`paied` integer DEFAULT false,
	`processed` integer DEFAULT false,
	FOREIGN KEY (`fk_user`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_contribution`("id", "fk_user", "formula", "min_x", "min_y", "max_x", "max_y", "paied", "processed") SELECT "id", "fk_user", "formula", "min_x", "min_y", "max_x", "max_y", "paied", "processed" FROM `contribution`;--> statement-breakpoint
DROP TABLE `contribution`;--> statement-breakpoint
ALTER TABLE `__new_contribution` RENAME TO `contribution`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `contribution_fk_user` ON `contribution` (`fk_user`);--> statement-breakpoint
CREATE TABLE `__new_contribution_without_compensation` (
	`id` text PRIMARY KEY NOT NULL,
	`fk_user` text,
	`formula` text NOT NULL,
	`paied` integer DEFAULT false,
	FOREIGN KEY (`fk_user`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_contribution_without_compensation`("id", "fk_user", "formula", "paied") SELECT "id", "fk_user", "formula", "paied" FROM `contribution_without_compensation`;--> statement-breakpoint
DROP TABLE `contribution_without_compensation`;--> statement-breakpoint
ALTER TABLE `__new_contribution_without_compensation` RENAME TO `contribution_without_compensation`;--> statement-breakpoint
CREATE INDEX `contribution_without_compensation_fk_user` ON `contribution_without_compensation` (`fk_user`);
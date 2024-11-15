CREATE TABLE `areas_to_generate` (
	`id` text PRIMARY KEY NOT NULL,
	`minX` real NOT NULL,
	`minY` real NOT NULL,
	`maxX` real NOT NULL,
	`maxY` real NOT NULL,
	`pyramidGenerationStepStatus` text DEFAULT 'not-started' NOT NULL,
	`pyramidGenerationStepWorkerId` text,
	FOREIGN KEY (`pyramidGenerationStepWorkerId`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `lidar_step_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`tileId` text NOT NULL,
	`areaToGenerateId` text NOT NULL,
	FOREIGN KEY (`tileId`) REFERENCES `tiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`areaToGenerateId`) REFERENCES `areas_to_generate`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `map_rendering_step_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`tileId` text NOT NULL,
	`areaToGenerateId` text NOT NULL,
	FOREIGN KEY (`tileId`) REFERENCES `tiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`areaToGenerateId`) REFERENCES `areas_to_generate`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tiles` (
	`id` text PRIMARY KEY NOT NULL,
	`minX` real NOT NULL,
	`minY` real NOT NULL,
	`maxX` real NOT NULL,
	`maxY` real NOT NULL,
	`lidarFileUrl` text NOT NULL,
	`lidarStepStatus` text DEFAULT 'not-started' NOT NULL,
	`lidarStepWorkerId` text,
	`mapRenderingStepStatus` text DEFAULT 'not-started' NOT NULL,
	`mapRenderingStepWorkerId` text,
	FOREIGN KEY (`lidarStepWorkerId`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`mapRenderingStepWorkerId`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `workers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`hashedApiKey` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workers_name_unique` ON `workers` (`name`);
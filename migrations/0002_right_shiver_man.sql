CREATE TABLE `areas_to_generate` (
	`id` text PRIMARY KEY NOT NULL,
	`min_x` real NOT NULL,
	`min_y` real NOT NULL,
	`max_x` real NOT NULL,
	`max_y` real NOT NULL,
	`pyramid_generation_step_status` text DEFAULT 'not-started' NOT NULL,
	`is_mergeable` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `lidar_step_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`index` integer NOT NULL,
	`tile_id` text NOT NULL,
	`area_to_generate_id` text NOT NULL,
	FOREIGN KEY (`tile_id`) REFERENCES `tiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`area_to_generate_id`) REFERENCES `areas_to_generate`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lidar_step_jobs_tile_id_index` ON `lidar_step_jobs` (`tile_id`);--> statement-breakpoint
CREATE INDEX `lidar_step_jobs_area_to_generate_id_index` ON `lidar_step_jobs` (`area_to_generate_id`);--> statement-breakpoint
CREATE TABLE `map_rendering_step_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`index` integer NOT NULL,
	`tile_id` text NOT NULL,
	`area_to_generate_id` text NOT NULL,
	FOREIGN KEY (`tile_id`) REFERENCES `tiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`area_to_generate_id`) REFERENCES `areas_to_generate`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `map_rendering_step_jobs_tile_id_index` ON `map_rendering_step_jobs` (`tile_id`);--> statement-breakpoint
CREATE INDEX `map_rendering_step_jobs_area_to_generate_id_index` ON `map_rendering_step_jobs` (`area_to_generate_id`);--> statement-breakpoint
CREATE TABLE `pyramid_rendering_step_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`index` integer NOT NULL,
	`area_to_generate_id` text NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`zoom` integer NOT NULL,
	`base_zoom_level_tile_id` text,
	`status` text DEFAULT 'not-started' NOT NULL,
	`worker_id` text,
	`start_time` integer,
	`finish_time` integer,
	FOREIGN KEY (`area_to_generate_id`) REFERENCES `areas_to_generate`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`base_zoom_level_tile_id`) REFERENCES `tiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `pyramid_rendering_step_jobs_area_to_generate_id_index` ON `pyramid_rendering_step_jobs` (`area_to_generate_id`);--> statement-breakpoint
CREATE TABLE `tiles` (
	`id` text PRIMARY KEY NOT NULL,
	`min_x` real NOT NULL,
	`min_y` real NOT NULL,
	`max_x` real NOT NULL,
	`max_y` real NOT NULL,
	`lidar_file_url` text NOT NULL,
	`lidar_step_status` text DEFAULT 'not-started' NOT NULL,
	`lidar_step_worker_id` text,
	`lidar_step_start_time` integer,
	`lidar_step_finish_time` integer,
	`map_rendering_step_status` text DEFAULT 'not-started' NOT NULL,
	`map_rendering_step_worker_id` text,
	`map_rendering_step_start_time` integer,
	`map_rendering_step_finish_time` integer,
	`is_mergeable` integer DEFAULT false,
	FOREIGN KEY (`lidar_step_worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`map_rendering_step_worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `workers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`hashed_api_key` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workers_name_unique` ON `workers` (`name`);
ALTER TABLE `pyramid_rendering_step_jobs` ADD `worker_id` text REFERENCES workers(id);--> statement-breakpoint
ALTER TABLE `pyramid_rendering_step_jobs` ADD `start_time` integer;--> statement-breakpoint
ALTER TABLE `pyramid_rendering_step_jobs` ADD `finish_time` integer;
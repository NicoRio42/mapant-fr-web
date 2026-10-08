CREATE TABLE `auth_challenges` (
	`id` text PRIMARY KEY,
	`browser_hash` text NOT NULL UNIQUE,
	`intent` text NOT NULL,
	`email` text NOT NULL,
	`pseudonym` text,
	`pseudonym_key` text,
	`code_digest` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`verified_at` integer,
	`consumed_at` integer,
	CONSTRAINT "challenge_attempts" CHECK("attempts" between 0 and 5),
	CONSTRAINT "challenge_intent" CHECK("intent" in ('signup','login'))
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY,
	`guest_hash` text,
	`user_id` text,
	`status` text DEFAULT 'playing' NOT NULL,
	`scoring_version` integer DEFAULT 1 NOT NULL,
	`total_points` integer DEFAULT 0 NOT NULL,
	`total_time` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	`claim_until` integer,
	`claimed_at` integer,
	CONSTRAINT `fk_games_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
	CONSTRAINT "game_owner" CHECK("guest_hash" is not null or "user_id" is not null),
	CONSTRAINT "game_status" CHECK("status" in ('playing','completed')),
	CONSTRAINT "game_points" CHECK("total_points" between 0 and 25000),
	CONSTRAINT "game_time" CHECK("total_time" between 0 and 1500000)
);
--> statement-breakpoint
CREATE TABLE `guest_sessions` (
	`token_hash` text PRIMARY KEY,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_rounds` (
	`id` text PRIMARY KEY,
	`game_id` text NOT NULL,
	`number` integer NOT NULL,
	`target_x` real NOT NULL,
	`target_y` real NOT NULL,
	`started_at` integer NOT NULL,
	`deadline_at` integer NOT NULL,
	`guess_lon` real,
	`guess_lat` real,
	`received_at` integer,
	`distance` real,
	`points` integer,
	`elapsed_ms` integer,
	`submission_id` text,
	CONSTRAINT `fk_game_rounds_game_id_games_id_fk` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`),
	CONSTRAINT "round_number" CHECK("number" between 1 and 5),
	CONSTRAINT "round_points" CHECK("points" between 0 and 5000),
	CONSTRAINT "round_time" CHECK("elapsed_ms" between 0 and 300000),
	CONSTRAINT "round_longitude" CHECK("guess_lon" between -180 and 180),
	CONSTRAINT "round_latitude" CHECK("guess_lat" between -90 and 90),
	CONSTRAINT "round_deadline" CHECK("deadline_at" = "started_at" + 300000),
	CONSTRAINT "round_result" CHECK(("received_at" is null and "points" is null and "elapsed_ms" is null and "submission_id" is null) or ("received_at" is not null and "points" is not null and "elapsed_ms" is not null and "submission_id" is not null)),
	CONSTRAINT "round_guess" CHECK(("guess_lon" is null) = ("guess_lat" is null))
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	CONSTRAINT `fk_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`pseudonym` text NOT NULL,
	`pseudonym_key` text NOT NULL UNIQUE,
	`email` text NOT NULL UNIQUE,
	`verified_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `challenges_expiry` ON `auth_challenges` (`expires_at`);--> statement-breakpoint
CREATE INDEX `games_guest` ON `games` (`guest_hash`);--> statement-breakpoint
CREATE INDEX `games_best` ON `games` (`user_id`,`status`,`total_points`,`total_time`,`completed_at`,`id`);--> statement-breakpoint
CREATE INDEX `guests_expiry` ON `guest_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `limits_expiry` ON `rate_limits` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `round_order` ON `game_rounds` (`game_id`,`number`);--> statement-breakpoint
CREATE INDEX `sessions_expiry` ON `sessions` (`expires_at`);
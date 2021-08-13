DROP DATABASE IF EXISTS `rentals`;
CREATE DATABASE `rentals`;
USE `rentals`;

CREATE TABLE `users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(70) NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `movies` (
  `movie_id` INT NOT NULL AUTO_INCREMENT,
  `movie_name` VARCHAR(50) NOT NULL,
  `number_in_stock` INT NOT NULL,
  `rental_per_day` DECIMAL(4,2) NOT NULL,
  `stars` DECIMAL(2,1) DEFAULT 0.0,
  PRIMARY KEY (`movie_id`)
) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `profiles` (
  `profile_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `dob` DATE,
  `isAdmin` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`profile_id`),
  FOREIGN KEY(`user_id`) REFERENCES users(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `rentals` (
  `rental_id` INT NOT NULL AUTO_INCREMENT,
  `profile_id` INT NOT NULL,
  `movie_id` INT NOT NULL UNIQUE,
  `purchase_time` TIMESTAMP DEFAULT NOW() NOT NULL,
  PRIMARY KEY (`rental_id`),
  FOREIGN KEY(`profile_id`) REFERENCES profiles(`profile_id`) ON DELETE CASCADE,
  FOREIGN KEY(`movie_id`) REFERENCES movies(`movie_id`) ON DELETE CASCADE
)ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
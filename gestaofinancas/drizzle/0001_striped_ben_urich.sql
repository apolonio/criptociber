CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileType` enum('husband','wife') NOT NULL,
	`description` varchar(512) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`category` enum('escola_cursos','manutencao_imoveis','agua','luz','condominio','comida','faculdade','plano_saude','celular','academia','viagens','economias','outros') NOT NULL,
	`expenseDate` timestamp NOT NULL,
	`expenseType` enum('fixed','variable') NOT NULL DEFAULT 'variable',
	`notes` text,
	`isRecurring` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileType` enum('husband','wife') NOT NULL,
	`displayName` varchar(128) NOT NULL,
	`avatarColor` varchar(16) NOT NULL DEFAULT '#6366f1',
	`monthlyBudget` decimal(12,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`)
);

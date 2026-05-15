-- CreateTable
CREATE TABLE `Funnel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `type` ENUM('WEBINAR', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `theme` JSON NOT NULL,
    `webinarId` INTEGER NULL,
    `createdById` INTEGER NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Funnel_slug_key`(`slug`),
    INDEX `Funnel_status_updatedAt_idx`(`status`, `updatedAt`),
    INDEX `Funnel_type_status_idx`(`type`, `status`),
    INDEX `Funnel_webinarId_idx`(`webinarId`),
    INDEX `Funnel_createdById_idx`(`createdById`),
    INDEX `Funnel_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FunnelPage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `funnelId` INTEGER NOT NULL,
    `kind` ENUM('REGISTRATION', 'THANK_YOU', 'ACCESS', 'ROOM', 'CUSTOM') NOT NULL,
    `key` VARCHAR(64) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `mode` ENUM('VISUAL', 'HTML') NOT NULL DEFAULT 'VISUAL',
    `title` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `blocks` JSON NOT NULL,
    `customHtml` TEXT NULL,
    `customCss` TEXT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FunnelPage_funnelId_key_key`(`funnelId`, `key`),
    UNIQUE INDEX `FunnelPage_funnelId_slug_key`(`funnelId`, `slug`),
    INDEX `FunnelPage_funnelId_position_idx`(`funnelId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FunnelCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#9a7b45',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FunnelCategory_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FunnelCategoryOnFunnel` (
    `funnelId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,

    PRIMARY KEY (`funnelId`, `categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Funnel` ADD CONSTRAINT `Funnel_webinarId_fkey` FOREIGN KEY (`webinarId`) REFERENCES `Webinar`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Funnel` ADD CONSTRAINT `Funnel_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FunnelPage` ADD CONSTRAINT `FunnelPage_funnelId_fkey` FOREIGN KEY (`funnelId`) REFERENCES `Funnel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FunnelCategoryOnFunnel` ADD CONSTRAINT `FunnelCategoryOnFunnel_funnelId_fkey` FOREIGN KEY (`funnelId`) REFERENCES `Funnel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FunnelCategoryOnFunnel` ADD CONSTRAINT `FunnelCategoryOnFunnel_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `FunnelCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

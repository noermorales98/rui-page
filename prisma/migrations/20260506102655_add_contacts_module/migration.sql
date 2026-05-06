-- CreateTable
CREATE TABLE `Contact` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Contact_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#6366f1',

    UNIQUE INDEX `Tag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactTag` (
    `contactId` INTEGER NOT NULL,
    `tagId` INTEGER NOT NULL,

    PRIMARY KEY (`contactId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactActivity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contactId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'NOTE',
    `body` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ContactTag` ADD CONSTRAINT `ContactTag_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactTag` ADD CONSTRAINT `ContactTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactActivity` ADD CONSTRAINT `ContactActivity_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactActivity` ADD CONSTRAINT `ContactActivity_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `ContactActivity_contactId_idx` ON `ContactActivity`(`contactId`);

-- AlterTable to add activities relation to User (already exists, adding the field)
ALTER TABLE `User` ADD COLUMN `activities` INT;

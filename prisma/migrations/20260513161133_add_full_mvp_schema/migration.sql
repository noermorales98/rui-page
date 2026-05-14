-- Backfill: migrate any legacy role=EDITOR rows to ASISTENTE before the enum is redefined.
-- Safe no-op when no such rows exist.
UPDATE `User` SET `role` = 'ADMIN' WHERE `role` = 'EDITOR' AND `email` = 'admin@crm.local';
UPDATE `User` SET `role` = 'ASISTENTE' WHERE `role` = 'EDITOR';

-- AlterTable
ALTER TABLE `Contact` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `CrmCampaign` ADD COLUMN `channel` ENUM('EMAIL', 'WHATSAPP') NOT NULL DEFAULT 'EMAIL',
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `segmentId` INTEGER NULL,
    ADD COLUMN `templateId` INTEGER NULL,
    ADD COLUMN `waLanguage` VARCHAR(16) NULL,
    ADD COLUMN `waTemplateName` VARCHAR(191) NULL,
    ADD COLUMN `waVariables` JSON NULL,
    MODIFY `bodyHtml` TEXT NULL;

-- AlterTable
ALTER TABLE `CrmForm` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `CrmSale` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `stripeCustomerId` VARCHAR(191) NULL,
    ADD COLUMN `stripePaymentIntentId` VARCHAR(191) NULL,
    ADD COLUMN `stripeSessionId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Deal` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Tag` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `emailVerified` DATETIME(3) NULL,
    ADD COLUMN `image` VARCHAR(191) NULL,
    MODIFY `role` ENUM('ADMIN', 'VENDEDOR', 'ASISTENTE') NOT NULL DEFAULT 'ASISTENTE';

-- AlterTable
ALTER TABLE `Webinar` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `Account` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(64) NOT NULL,
    `provider` VARCHAR(64) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(64) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    INDEX `Account_userId_idx`(`userId`),
    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StripeEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(64) NOT NULL,
    `payload` JSON NOT NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StripeEvent_eventId_key`(`eventId`),
    INDEX `StripeEvent_type_createdAt_idx`(`type`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebinarIntegration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `webinarId` INTEGER NOT NULL,
    `integrationId` INTEGER NOT NULL,
    `externalId` VARCHAR(191) NULL,
    `config` JSON NULL,
    `lastSyncAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WebinarIntegration_webinarId_key`(`webinarId`),
    INDEX `WebinarIntegration_integrationId_idx`(`integrationId`),
    INDEX `WebinarIntegration_externalId_idx`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampaignTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `channel` ENUM('EMAIL', 'WHATSAPP') NOT NULL,
    `subject` VARCHAR(191) NULL,
    `previewText` VARCHAR(191) NULL,
    `bodyHtml` TEXT NULL,
    `bodyText` TEXT NULL,
    `waTemplate` VARCHAR(191) NULL,
    `variables` JSON NULL,
    `createdById` INTEGER NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CampaignTemplate_channel_idx`(`channel`),
    INDEX `CampaignTemplate_createdById_idx`(`createdById`),
    INDEX `CampaignTemplate_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Segment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `filters` JSON NOT NULL,
    `isDynamic` BOOLEAN NOT NULL DEFAULT true,
    `createdById` INTEGER NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Segment_name_key`(`name`),
    INDEX `Segment_createdById_idx`(`createdById`),
    INDEX `Segment_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Integration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider` ENUM('ZOOM', 'STREAMYARD', 'STRIPE', 'WHATSAPP_CLOUD', 'SMTP') NOT NULL,
    `status` ENUM('ACTIVE', 'DISABLED', 'ERROR') NOT NULL DEFAULT 'ACTIVE',
    `config` JSON NOT NULL,
    `lastSyncAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Integration_provider_key`(`provider`),
    INDEX `Integration_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actorId` INTEGER NULL,
    `entityType` VARCHAR(64) NOT NULL,
    `entityId` INTEGER NOT NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'STAGE_CHANGE', 'LOGIN') NOT NULL,
    `changes` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entityType_entityId_createdAt_idx`(`entityType`, `entityId`, `createdAt`),
    INDEX `AuditLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    INDEX `AuditLog_action_createdAt_idx`(`action`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Landing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `title` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `ogImageUrl` VARCHAR(191) NULL,
    `faviconUrl` VARCHAR(191) NULL,
    `customHead` TEXT NULL,
    `customCss` TEXT NULL,
    `formId` INTEGER NULL,
    `ownFormConfig` JSON NULL,
    `flowId` INTEGER NULL,
    `createdById` INTEGER NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Landing_slug_key`(`slug`),
    INDEX `Landing_status_updatedAt_idx`(`status`, `updatedAt`),
    INDEX `Landing_deletedAt_idx`(`deletedAt`),
    INDEX `Landing_createdById_idx`(`createdById`),
    INDEX `Landing_formId_idx`(`formId`),
    INDEX `Landing_flowId_idx`(`flowId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LandingBlock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `landingId` INTEGER NOT NULL,
    `type` ENUM('HERO', 'VIDEO', 'CTA', 'FORM_EMBED', 'TESTIMONIALS', 'FAQ', 'FOOTER', 'CUSTOM_HTML') NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `config` JSON NOT NULL,
    `customHtml` TEXT NULL,
    `customCss` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LandingBlock_landingId_position_idx`(`landingId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LandingView` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `landingId` INTEGER NOT NULL,
    `ipHash` VARCHAR(64) NOT NULL,
    `uaHash` VARCHAR(64) NOT NULL,
    `referer` TEXT NULL,
    `utm` JSON NULL,
    `viewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LandingView_landingId_viewedAt_idx`(`landingId`, `viewedAt`),
    INDEX `LandingView_ipHash_landingId_idx`(`ipHash`, `landingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Flow` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `trigger` ENUM('FORM_SUBMITTED', 'LANDING_VIEWED', 'LANDING_SUBMITTED', 'WEBINAR_REGISTERED', 'WEBINAR_ATTENDED', 'SALE_PAID') NOT NULL,
    `triggerConfig` JSON NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdById` INTEGER NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Flow_trigger_status_idx`(`trigger`, `status`),
    INDEX `Flow_deletedAt_idx`(`deletedAt`),
    INDEX `Flow_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlowStep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `flowId` INTEGER NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `action` ENUM('REDIRECT', 'ASSIGN_TAG', 'MOVE_DEAL', 'CREATE_DEAL', 'SEND_EMAIL', 'SEND_WHATSAPP', 'UPDATE_CONTACT_STATUS', 'WAIT') NOT NULL,
    `config` JSON NOT NULL,
    `delayMins` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FlowStep_flowId_position_idx`(`flowId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlowRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `flowId` INTEGER NOT NULL,
    `contactId` INTEGER NULL,
    `triggerPayload` JSON NULL,
    `status` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FlowRun_flowId_status_startedAt_idx`(`flowId`, `status`, `startedAt`),
    INDEX `FlowRun_contactId_startedAt_idx`(`contactId`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlowRunStep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `runId` INTEGER NOT NULL,
    `stepId` INTEGER NOT NULL,
    `position` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `runAt` DATETIME(3) NOT NULL,
    `executedAt` DATETIME(3) NULL,
    `result` JSON NULL,
    `errorMessage` TEXT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FlowRunStep_status_runAt_idx`(`status`, `runAt`),
    INDEX `FlowRunStep_runId_position_idx`(`runId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Contact_deletedAt_idx` ON `Contact`(`deletedAt`);

-- CreateIndex
CREATE INDEX `ContactActivity_contactId_createdAt_idx` ON `ContactActivity`(`contactId`, `createdAt`);

-- CreateIndex
CREATE INDEX `CrmCampaign_channel_status_idx` ON `CrmCampaign`(`channel`, `status`);

-- CreateIndex
CREATE INDEX `CrmCampaign_templateId_idx` ON `CrmCampaign`(`templateId`);

-- CreateIndex
CREATE INDEX `CrmCampaign_segmentId_idx` ON `CrmCampaign`(`segmentId`);

-- CreateIndex
CREATE INDEX `CrmCampaign_deletedAt_idx` ON `CrmCampaign`(`deletedAt`);

-- CreateIndex
CREATE INDEX `CrmForm_deletedAt_idx` ON `CrmForm`(`deletedAt`);

-- CreateIndex
CREATE UNIQUE INDEX `CrmSale_stripeSessionId_key` ON `CrmSale`(`stripeSessionId`);

-- CreateIndex
CREATE UNIQUE INDEX `CrmSale_stripePaymentIntentId_key` ON `CrmSale`(`stripePaymentIntentId`);

-- CreateIndex
CREATE INDEX `CrmSale_deletedAt_idx` ON `CrmSale`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Deal_deletedAt_idx` ON `Deal`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Tag_deletedAt_idx` ON `Tag`(`deletedAt`);

-- CreateIndex
CREATE INDEX `User_deletedAt_idx` ON `User`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Webinar_deletedAt_idx` ON `Webinar`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Webinar_date_idx` ON `Webinar`(`date`);

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebinarIntegration` ADD CONSTRAINT `WebinarIntegration_webinarId_fkey` FOREIGN KEY (`webinarId`) REFERENCES `Webinar`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebinarIntegration` ADD CONSTRAINT `WebinarIntegration_integrationId_fkey` FOREIGN KEY (`integrationId`) REFERENCES `Integration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmCampaign` ADD CONSTRAINT `CrmCampaign_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `CampaignTemplate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmCampaign` ADD CONSTRAINT `CrmCampaign_segmentId_fkey` FOREIGN KEY (`segmentId`) REFERENCES `Segment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampaignTemplate` ADD CONSTRAINT `CampaignTemplate_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Segment` ADD CONSTRAINT `Segment_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Landing` ADD CONSTRAINT `Landing_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `CrmForm`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Landing` ADD CONSTRAINT `Landing_flowId_fkey` FOREIGN KEY (`flowId`) REFERENCES `Flow`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Landing` ADD CONSTRAINT `Landing_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LandingBlock` ADD CONSTRAINT `LandingBlock_landingId_fkey` FOREIGN KEY (`landingId`) REFERENCES `Landing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LandingView` ADD CONSTRAINT `LandingView_landingId_fkey` FOREIGN KEY (`landingId`) REFERENCES `Landing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Flow` ADD CONSTRAINT `Flow_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FlowStep` ADD CONSTRAINT `FlowStep_flowId_fkey` FOREIGN KEY (`flowId`) REFERENCES `Flow`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FlowRun` ADD CONSTRAINT `FlowRun_flowId_fkey` FOREIGN KEY (`flowId`) REFERENCES `Flow`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FlowRun` ADD CONSTRAINT `FlowRun_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FlowRunStep` ADD CONSTRAINT `FlowRunStep_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `FlowRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FlowRunStep` ADD CONSTRAINT `FlowRunStep_stepId_fkey` FOREIGN KEY (`stepId`) REFERENCES `FlowStep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

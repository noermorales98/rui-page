-- AddIndex webinarId + commercialStatus on WebinarRegistration
CREATE INDEX `WebinarRegistration_webinarId_commercialStatus_idx` ON `WebinarRegistration`(`webinarId`, `commercialStatus`);

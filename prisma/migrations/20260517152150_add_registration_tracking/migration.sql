-- AddColumn registrationCount and registrationDates to WebinarRegistration
ALTER TABLE `WebinarRegistration`
  ADD COLUMN `registrationCount` INT NOT NULL DEFAULT 1,
  ADD COLUMN `registrationDates` JSON NOT NULL DEFAULT (JSON_ARRAY());

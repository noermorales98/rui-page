-- CreateEnum CommercialStatus and add field to WebinarRegistration
ALTER TABLE `WebinarRegistration`
  ADD COLUMN `commercialStatus` ENUM('SIN_CONTACTAR','CONTACTADO','INTERESADO','PLAN_PAGOS','NO_RESPONDE','DESCARTADO') NOT NULL DEFAULT 'SIN_CONTACTAR';

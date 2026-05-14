-- Ampliar enum de tipo de campo: controles HTML configurables (ver `config.html`).
ALTER TABLE `CrmFormField` MODIFY COLUMN `type` ENUM(
  'SHORT_TEXT',
  'FULL_NAME',
  'PHONE',
  'PHONE_WITH_COUNTRY',
  'EMAIL',
  'CUSTOM_DATE',
  'CUSTOM_TIME',
  'CUSTOM_DATETIME',
  'HTML_INPUT'
) NOT NULL;

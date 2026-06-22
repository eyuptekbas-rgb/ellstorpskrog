ALTER TABLE "SiteSettings"
ADD COLUMN "rmsTerminalSettings" JSONB,
ADD COLUMN "rmsPrinterRegistry" JSONB,
ADD COLUMN "rmsEscposConfig" JSONB,
ADD COLUMN "rmsWindowsPrinterConfig" JSONB;

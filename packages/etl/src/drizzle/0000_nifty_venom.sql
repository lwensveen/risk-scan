CREATE TYPE "public"."risk_category" AS ENUM('BDC', 'CoreBank', 'HealthcareRollup', 'OfficeREIT', 'RegionalBank', 'Stablecoin');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TABLE "entity_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "risk_category" NOT NULL,
	"ticker" text NOT NULL,
	"ts" bigint NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_flag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "risk_category" NOT NULL,
	"ticker" text NOT NULL,
	"ts" bigint NOT NULL,
	"flags" jsonb NOT NULL,
	"severity" "severity" NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_es_cat_ticker_ts" ON "entity_snapshot" USING btree ("category","ticker","ts");--> statement-breakpoint
CREATE INDEX "idx_entity_snapshot_ticker" ON "entity_snapshot" USING btree ("ticker");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_rf_cat_ticker_ts" ON "risk_flag" USING btree ("category","ticker","ts");--> statement-breakpoint
CREATE INDEX "idx_risk_flag_severity" ON "risk_flag" USING btree ("severity");
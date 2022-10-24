CREATE TABLE IF NOT EXISTS "public"."oidc_integrations" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4()
  , "client_id" TEXT NOT NULL
  , "client_secret" TEXT NOT NULL
  , "domain" TEXT NOT NULL
  , "linked_organization_id" uuid NOT NULL UNIQUE REFERENCES "public"."organizations"("id") ON DELETE CASCADE
  , "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  , "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

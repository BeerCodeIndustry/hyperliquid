
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "api_private_key" "text",
    "proxy_id" "uuid",
    "name" "text",
    "public_address" "text"
);

ALTER TABLE "public"."accounts" OWNER TO "postgres";

COMMENT ON TABLE "public"."accounts" IS 'Аккаунты';

CREATE TABLE IF NOT EXISTS "public"."batches" (
    "account_1_id" "uuid" NOT NULL,
    "account_2_id" "uuid" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

ALTER TABLE "public"."batches" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."proxies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "host" "text" DEFAULT ''::"text",
    "password" "text",
    "username" "text",
    "port" "text"
);

ALTER TABLE "public"."proxies" OWNER TO "postgres";

COMMENT ON TABLE "public"."proxies" IS 'Прокси';

ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."batches"
    ADD CONSTRAINT "batches_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."proxies"
    ADD CONSTRAINT "proxies_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "public_accounts_proxy_id_fkey" FOREIGN KEY ("proxy_id") REFERENCES "public"."proxies"("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."batches"
    ADD CONSTRAINT "public_batches_account_1_id_fkey" FOREIGN KEY ("account_1_id") REFERENCES "public"."accounts"("id") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."batches"
    ADD CONSTRAINT "public_batches_account_2_id_fkey" FOREIGN KEY ("account_2_id") REFERENCES "public"."accounts"("id") ON UPDATE CASCADE;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";

GRANT ALL ON TABLE "public"."batches" TO "anon";
GRANT ALL ON TABLE "public"."batches" TO "authenticated";
GRANT ALL ON TABLE "public"."batches" TO "service_role";

GRANT ALL ON TABLE "public"."proxies" TO "anon";
GRANT ALL ON TABLE "public"."proxies" TO "authenticated";
GRANT ALL ON TABLE "public"."proxies" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;

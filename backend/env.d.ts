
declare module "bun" {
    interface Env {
        readonly BETTER_AUTH_SECRET: string;
        readonly BETTER_AUTH_URL: string;
        readonly PORT: string;
        readonly DATABASE_URL: string;
        readonly GITHUB_CLIENT_ID: string;
        readonly GITHUB_CLIENT_SECRET: string;
        readonly AIRBYTE_CLIENT_ID: string;
        readonly AIRBYTE_CLIENT_SECRET: string;
        readonly FRONTEND_BASE_URL: string;
    }
}

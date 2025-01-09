import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { db } from '../services/db';

export const auth = betterAuth({
    database: db,
    trustedOrigins: ["*"], //["http://localhost:3000"],
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            airbyteInstance: {
                type: 'string',
                required: true,
                defaultValue: 'serverless'
            },
        }
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
            redirectURI: (process.env.FRONTEND_URL || "http://127.0.0.1:3000/duck-annotate") + "/auth/callback/github"
        }
    },
    advanced: {
        generateId: false,
    },
    plugins: [openAPI({
        path: "/swagger"
    })]
});

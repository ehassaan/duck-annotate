import { betterAuth, User } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { db } from '../services/db';
import { createWorkspace } from "../services/airbyte";
import { frontend_base_url } from './constants';


export const auth = betterAuth({
    database: db,
    trustedOrigins: frontend_base_url ? [`${frontend_base_url.protocol}//${frontend_base_url.host}`] : [],
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            airbyteWsId: {
                type: 'string',
                required: false,
            },
        }
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
            redirectURI: process.env.BACKEND_BASE_URL + "/api/auth/callback/github"
        }
    },
    advanced: {
        generateId: false,
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user: User) => {
                    const res = await createWorkspace(`${user.email}`) as any;
                    console.log("Airbyte: ", res);
                    if (res.error) {
                        throw Error("Failed to create Airbyte workspace");
                    }
                    (user as any).airbyteWsId = res.data?.workspaceId;
                    return user as any;
                }
            }
        }
    },
    plugins: [openAPI({
        path: "/swagger"
    })]
});

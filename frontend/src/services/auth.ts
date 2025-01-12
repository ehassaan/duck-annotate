
import { createAuthClient } from "better-auth/client";

console.log("Backend: ", import.meta.env.VITE_BACKEND_URL);

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BACKEND_URL,
});

export const signinSocial = async (provider: string) => {
    const data = await authClient.signIn.social({
        provider: provider as any,
    });
    return data;
};

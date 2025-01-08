
import { Auth0Client } from '@auth0/auth0-spa-js';

export type ProviderName = "github";

const providers = [
    {
        provider: "github",
        clientId: "Ov23liJSw6leWlr0Sx6y",
        redirectUrl: "http://127.0.0.1:3000/duck-annotate/callback/github",
        domain: "https://github.com/login/oauth",
        
    }
] as { provider: ProviderName, clientId: string, redirectUrl: string, domain: string; }[];


const ghClient = createAuthClient("github");

export const authClients: Record<ProviderName, Auth0Client> = {
    github: ghClient
};


function createAuthClient(provider: ProviderName) {
    const providerConfig = providers.find(p => p.provider === provider);
    if (!providerConfig) {
        throw new Error(`Unknown provider: ${provider}`);
    }

    const auth0 = new Auth0Client({
        domain: providerConfig.domain,
        clientId: providerConfig.clientId,
        authorizationParams: {
            redirect_uri: providerConfig.redirectUrl
        },
    });
    return auth0;
}

export async function getToken(provider: ProviderName) {
    try {
        const token = await authClients[provider].getTokenSilently();
        if (token) {
            localStorage.setKey("token_" + provider, token);
            return token;
        }
    } catch (error: any) {
        if (error.error !== 'login_required') {
            throw error;
        }
    }
    return null;
}


export async function requestLogin(provider: ProviderName) {
    await authClients[provider].loginWithRedirect();
}


export async function handleCallback(provider: ProviderName) {
    if (provider === "github") {
        const result = await authClients[provider].handleRedirectCallback(window.location.href);
        console.log("Callback Result: ", result);
        const token = await getToken(provider);
        console.log("Token: ", token);
        localStorage.setKey("token_" + provider, token);
    }
}

export async function logout(provider: ProviderName) {
    await authClients[provider].logout();
    localStorage.removeItem("token_" + provider);
}

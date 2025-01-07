
import { Auth0Client } from '@auth0/auth0-spa-js';

const providers = [
    {
        provider: "github",
        clientId: "Ov23liJSw6leWlr0Sx6y",
        redirectUrl: "https://ehassaan.github.io/duck-annotate/callback/github",
        domain: "https://github.com/login/oauth/authorize",
    }
];

export async function createAuthClient(provider: string) {
    const providerConfig = providers.find(p => p.provider === provider);
    if (!providerConfig) {
        throw new Error(`Unknown provider: ${provider}`);
    }

    const auth0 = new Auth0Client({
        domain: providerConfig.domain,
        clientId: providerConfig.clientId,
        authorizationParams: {
            redirect_uri: providerConfig.redirectUrl
        }
    });
    return auth0;
}

export async function getToken(auth0: Auth0Client) {
    try {
        return await auth0.getTokenSilently();
    } catch (error: any) {
        if (error.error !== 'login_required') {
            throw error;
        }
    }
    return null;
}



import Elysia, { t } from 'elysia';
import { createFetch } from "@better-fetch/fetch";
import { upsertConnectedAccount } from '../data/user';
import { jwtDecode } from "jwt-decode";
import { Account } from 'better-auth/types';


const tokenUrls = {
    airbyte: 'https://api.airbyte.com/v1/applications/token',
    github: 'https://github.com/login/oauth/access_token'
};


const $fetch = createFetch({
    retry: 0
});

export default new Elysia({ prefix: '/connections' })
    .get('/:provider', async ({ error, connectedAccounts, params: { provider } }) => {

        const account = (connectedAccounts as Partial<Account>[]).find((a) => a.providerId === provider);

        if (account) {
            return {
                message: "Success",
                data: {
                    provider,
                    account
                }
            };
        }
        else {
            return error(404, {
                message: "Not Found",
            });
        }
    })
    .post('/airbyte', async ({ body, error, user }) => {
        console.log("Airbyte: ", body, user);

        const tokenRes = await $fetch(tokenUrls.airbyte, {
            method: 'POST',
            body: {
                client_id: body.clientId,
                client_secret: body.clientSecret,
                "grant-type": "client_credentials"
            },
        });
        if (tokenRes.error) {
            return error(422, {
                message: "Failed to get Airbyte token: " + tokenRes.error.message,
                status: tokenRes.error.status
            });
        }
        console.log("Airbyte Token: ", tokenRes.data);
        try {
            const res = await upsertConnectedAccount({
                providerId: "airbyte",
                accountId: body.clientId,
                refreshToken: body.clientSecret,
                userId: user.id,
                refreshTokenExpiresAt: null,
                accessToken: (tokenRes.data as any).access_token,
                accessTokenExpiresAt: new Date(Date.now() + (tokenRes.data as any).expires_in * 1000),
                updatedAt: new Date()
            });
            console.log("Insert response: ", res);
            return {
                message: "Success"
            };
        }
        catch (err) {
            console.log("Insert Failed: ", err);
            return error(422, {
                message: "Failed to insert",
            });
        }

    }, {
        body: t.Object({
            clientId: t.String(),
            clientSecret: t.String(),
        })
    }).post('/github', async ({ body, error, user }) => {
        console.log("Github: ", body, user);

        try {
            const res = await $fetch(tokenUrls.github, {
                method: 'POST',
                body: {
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code: body.code,
                    redirect_uri: body.redirect_uri,
                },
            });

            if (res.error) {
                return error(422, {
                    message: "Failed to get Github token: " + res.error.message,
                });
            }

            console.log("Response: ", res);

            return {
                message: "Success",
            };
        }

        catch (err) {
            console.log("Error: ", err);
        }

    }, {
        body: t.Object({
            code: t.String(),
            redirect_uri: t.String({ format: 'uri' })
        })
    }).post('/motherduck', async ({ body, error, user }) => {
        console.log("Motherduck: ", body, user);

        const payload = jwtDecode(body.token) as any;
        console.log("Token payload: ", payload);

        try {
            const res = await upsertConnectedAccount({
                providerId: "motherduck",
                accountId: payload.userId,
                refreshToken: null,
                userId: user.id,
                refreshTokenExpiresAt: null,
                accessToken: body.token,
                accessTokenExpiresAt: new Date(payload.exp * 1000),
                updatedAt: new Date()
            });

            return {
                message: "Success",
                data: {
                    accountId: payload.userId,
                    expiry: new Date(payload.exp * 1000)
                }
            };
        }

        catch (err) {
            console.log("Error: ", err);
        }

    }, {
        body: t.Object({
            token: t.String(),
        })
    });

import Elysia, { t } from 'elysia';
import { createFetch } from "@better-fetch/fetch";


const $fetch = createFetch({
    baseURL: 'https://api.airbyte.com',
});

let abToken: string | null = null;
let abTokenExpiry: Date = new Date();


async function getAirbyteToken() {
    if (abToken && (abTokenExpiry.getTime() - Date.now()) > 10000) {
        console.debug("Reusing Airbyte token");
        return {
            token: abToken,
            expiry: abTokenExpiry
        };
    }
    else {
        console.debug("Fetching new Airbyte token");
        const res = await $fetch('/v1/applications/token', {
            method: 'POST',
            body: {
                "client_id": process.env.AIRBYTE_CLIENT_ID,
                "client_secret": process.env.AIRBYTE_CLIENT_SECRET,
                "grant-type": "client_credentials"
            }
        });
        if (!res.error && res.data) {
            abToken = (res.data as any).access_token;
            abTokenExpiry = new Date(Date.now() + (res.data as any).expires_in * 1000);
            return {
                token: abToken,
                expiry: abTokenExpiry,
                error: res.error
            };
        }
        return {
            error: res.error
        };
    }
}


export default new Elysia({ prefix: '/airbyte' })
    .resolve(async ({ request }) => {

    })
    .all('/*', async ({ request, path, body, error, user }) => {
        console.log("Airbyte: ", body, user);

        const tokenRes = await getAirbyteToken();

        if (tokenRes.error) {
            return error(401, {
                message: "Unauthorized",
            });
        }

        const res = await $fetch(path.replace('/api/airbyte', ''), {
            method: request.method,
            headers: {
                "Authorization": `Bearer ${tokenRes.token}`
            },
            body,
        });
        if (res.error) {
            return error(res.error.status, {
                message: res.error.message,
                statusText: res.error.statusText,
            });
        }

        return {
            message: "Success",
            data: res.data
        };
    }, {
        body: t.Object({
            name: t.String(),
            definitionId: t.String(),
            workspaceId: t.String(),
            configuration: t.Object({})
        })
    });

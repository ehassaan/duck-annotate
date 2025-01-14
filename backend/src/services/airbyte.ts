import { createFetch } from '@better-fetch/fetch';


const $fetch = createFetch({
    baseURL: 'https://api.airbyte.com',
});

let abToken: string | null = null;
let abTokenExpiry: Date = new Date();

export const airbyteRoutes = [
    {
        type: "LIST",
        route: "/v1/destinations",
        workspaceParam: "workspaceIds",
    },
    {
        type: "LIST",
        route: "/v1/connections",
        workspaceParam: "workspaceIds",
    },
    {
        type: "LIST",
        route: "/v1/sources",
        workspaceParam: "workspaceIds",
    },
    {
        type: "LIST",
        route: "/v1/jobs",
        workspaceParam: "workspaceIds",
        checkResponseWs: false
    },
    {
        type: "CREATE",
        route: "/v1/destinations",
        workspaceParam: "workspaceId",
    },
    {
        type: "CREATE",
        route: "/v1/connections",
        workspaceParam: "workspaceId",
    },
    {
        type: "CREATE",
        route: "/v1/sources",
        workspaceParam: "workspaceId",
    },
    {
        type: "CREATE",
        route: "/v1/jobs",
        workspaceParam: "workspaceId",
    },
    {
        type: "GET",
        route: "/v1/destinations/:id",
        verifyResponseWs: true
    },
    {
        type: "GET",
        route: "/v1/connections/:id",
        verifyResponseWs: true
    },
    {
        type: "GET",
        route: "/v1/sources/:id",
        verifyResponseWs: true
    },
    {
        type: "DELETE",
        route: "/v1/destinations/:id",
        workspaceParam: "workspaceId",
    },
    {
        type: "DELETE",
        route: "/v1/connections/:id",
        workspaceParam: "workspaceId",
    },
    {
        type: "DELETE",
        route: "/v1/sources/:id",
        workspaceParam: "workspaceId",
    },
    {
        type: "UPDATE",
        route: "/v1/destinations/:id",
        workspaceParam: "workspaceId",
    },
] as AirbyteRequestRoute[];

export interface AirbyteRequestRoute {
    type: "LIST" | "CREATE" | "GET" | "DELETE" | "UPDATE";
    workspaceParam?: string;
    route: string;
    verifyResponseWs?: boolean;
}


export async function getOrFetchAirbyteToken() {
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
            };
        }
        return {
            error: res.error
        };
    }
}


export interface AirbyteRequestOptions {
    method?: "GET" | "POST" | "DELETE" | "PATCH";
    path: string;
    query?: any;
    body?: any;
    workspaceId: string;
    checkResponseWs?: boolean;
}

export async function airbyteGet(args: Omit<AirbyteRequestOptions, "body" | "method">) {
    const query = { ...args.query, workspaceIds: args.workspaceId };
    const path = args.path.replace("/api/airbyte", "");
    const res = await airbyteRequest({ method: "GET", path, query });

    if (!res.error && res.data && res.data.workspaceId === args.workspaceId) {
        return res;
    }
    else return {
        error: res.error ?? { status: 404, message: "No resource found for the attached workspace" }
    };
}

export async function airbyteDelete(args: Omit<AirbyteRequestOptions, "body" | "method">) {
    const query = { ...args.query, workspaceIds: args.workspaceId };
    const path = args.path.replace("/api/airbyte", "");
    const res = await airbyteRequest({ method: "GET", path, query });

    if (!res.error && res.data && res.data.workspaceId === args.workspaceId) {
        const res = await airbyteRequest({ method: "DELETE", path, query });
        return res;
    }
    else return {
        error: res.error ?? { status: 400, message: "No resource found for the attached workspace" }
    };
}

export async function airbyteUpdate(args: Omit<AirbyteRequestOptions, "query" | "method">) {
    const path = args.path.replace("/api/airbyte", "");
    const res = await airbyteRequest({ method: "GET", path });

    if (!res.error && res.data && res.data.workspaceId === args.workspaceId) {
        const resUpdate = await airbyteRequest({ method: "PATCH", path, body: args.body });
        return resUpdate;
    }
    else return {
        error: res.error ?? { status: 400, message: "No resource found for the attached workspace" }
    };
}

export async function airbyteList(args: Omit<AirbyteRequestOptions, "body" | "method">) {
    const query = { ...args.query, workspaceIds: args.workspaceId };
    const path = args.path.replace("/api/airbyte", "");
    const res = await airbyteRequest({ method: "GET", path, query });
    if (!res.error
        && res.data
        && (
            !args.checkResponseWs || !res.data.data?.find((d: any) => d.workspaceId !== args.workspaceId)
        )
    ) {
        return res;
    }
    else return {
        error: res.error ?? { status: 404, message: "No resource found for the attached workspace" }
    };
}

export async function airbyteCreate(args: Omit<AirbyteRequestOptions, "query" | "method">) {
    const body = { ...args.body ?? {}, workspaceId: args.workspaceId };
    const path = args.path.replace("/api/airbyte", "");
    return await airbyteRequest({ method: "POST", path, body });
}

export async function createWorkspace(name: string) {
    return await airbyteRequest({
        method: "POST",
        path: "/v1/workspaces",
        body: {
            name,
        }
    });
}


async function airbyteRequest<T = any>(args: Omit<AirbyteRequestOptions, "workspaceId">) {
    const tokenRes = await getOrFetchAirbyteToken();
    if (tokenRes.error) {
        return {
            error: tokenRes.error
        };
    }
    console.debug("Airbyte Request: ", args);
    const res = await $fetch<T>(args.path, {
        method: args.method,
        query: args.query,
        body: args.body,
        headers: {
            "Authorization": `Bearer ${tokenRes.token}`
        },
    });
    console.debug("Airbyte response: ", res);
    // if (res.data === "" || (res.data as any)?.data === "") return { error: res.error, data: null };
    return res;
}

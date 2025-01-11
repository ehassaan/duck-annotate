import Elysia, { t } from 'elysia';
import { airbyteGet, airbyteList, airbyteCreate, airbyteRoutes } from '../services/airbyte';



let app = new Elysia({ prefix: '/airbyte' })
    .onBeforeHandle(async ({ request, path, error, user }) => {
        if (!user?.airbyteWsId) {
            return error(400, {
                message: "No Attached Airbyte Workspace",
            });
        }
    });


for (const route of airbyteRoutes) {
    if (route.type === "CREATE") {
        app = app.post(route.route, async ({ path, query, body, error, user }) => {
            console.log("PAth: ", path);

            let res = await airbyteCreate({ path, query, body, workspaceId: user.airbyteWsId });
            if (res.error) {
                return error(res.error.status, {
                    message: res.error.message,
                });
            }
            return {
                message: "Success",
                data: res.data
            };
        });
    }
    else if (route.type === "LIST") {
        app = app.get(route.route, async ({ path, query, error, user }) => {
            console.log("PAth: ", path);
            let res = await airbyteList({ path, query, workspaceId: user.airbyteWsId });
            if (res.error) {
                return error(res.error.status, {
                    message: res.error.message,
                });
            }
            return {
                message: "Success",
                data: res.data
            };
        });
    }
    else if (route.type === "GET") {
        app = app.get(route.route, async ({ path, query, error, user }) => {
            console.log("PAth: ", path);
            let res = await airbyteGet({ path, query, workspaceId: user.airbyteWsId });
            if (res.error) {
                return error(res.error.status, {
                    message: res.error.message,
                });
            }
            return {
                message: "Success",
                data: res.data
            };
        });
    }
}

export default app;

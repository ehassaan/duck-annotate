import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import authPlugin from './plugins/authPlugin';
import airbyteController from './controllers/airbyteController';
// import { checkAuth, session } from './middlewars/auth_middleware';
import gitController from './controllers/gitController';
import schemaController from './controllers/schemaController';
import connectionsController from './controllers/connectionsController';
import { frontend_base_url } from './libs/constants';


let app = new Elysia()
  .onError(({ request, path, error }) => {
    console.error(`${request.method} ${path}`, error);
  })
  .onBeforeHandle(({ path, request: { method } }) => console.log(`${method} ${path}`))
  .use(cors({
    origin: [`${frontend_base_url?.protocol}//${frontend_base_url?.host}`],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }))
  .group("/api", app => app
    .use(authPlugin)
    .use(connectionsController)
    .use(airbyteController)
    .use(gitController)
    .use(schemaController))
  .use(swagger({ path: "/swagger" }));

app.listen(process.env.PORT ?? 5000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

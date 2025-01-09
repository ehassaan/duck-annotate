import Elysia, { t } from 'elysia';
import path from 'path';
// import git from 'isomorphic-git';
// import gitHttp from 'isomorphic-git/http/node';
import fs from 'node:fs/promises';
import { cloneRepo } from '../services/git';
import { scanRepo } from '../services/codescan';


export default new Elysia({ prefix: '/git' })
    .post('/', async ({ body, error, user }) => {
        console.log("Git: ", body, user);

        const git_url = body.git_https_url;
        const git_name = git_url.split('/').pop();

        if (!git_name || git_name === "") {
            return error(422, {
                message: "Invalid git url",
                status: 422
            });
        }

        const dir = path.join(process.cwd(), '.temp_data', "test_user", 'repos', git_name);
        if (await fs.exists(dir)) {
            await fs.rm(dir, { recursive: true, force: true });
        }
        try {
            // const res = await git.clone({ fs: fs, http: gitHttp, dir, url: 'https://github.com/isomorphic-git/lightning-fs' });
            const res = await cloneRepo(path.dirname(dir), git_url, body.branch);
            console.log("Cloned Successfully");
            const result = await scanRepo("python", "**/*.py", 1500);
            return {
                message: "Success",
                data: result
            };
        }
        catch (e) {
            console.log("Error: ", e);
            return error(422, {
                message: "Failed to clone repo: " + e.message,
                status: 422
            });
        }
    }, {
        body: t.Object({
            git_https_url: t.String(),
            branch: t.Optional(t.String())
        })
    });

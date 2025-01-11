
import { exec } from 'node:child_process';


export async function cloneRepo(dir: string, url: string, branch?: string) {
    return new Promise((resolve, reject) => {
        exec(`git clone --depth 1 --filter=blob:limit=5M${branch ? ` --branch ${branch}` : ''} --single-branch "${url}"`, {
            cwd: dir,
        }, (err, stdout, stderr) => {
            console.log("Clone Result: ", err, stdout, stderr);
            if (err) {
                reject(err);
                return;
            }
            return resolve(stdout);
        });
    });
}

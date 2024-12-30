
import { configureSingle, fs } from '@zenfs/core';
import { WebAccess } from '@zenfs/dom';


export async function cloneRepo() {

    const dir = await window.navigator.storage.getDirectory();
    await configureSingle({ backend: WebAccess, handle: dir });

    if (!fs.existsSync('/test.txt')) {
        fs.writeFileSync('/test.txt', 'This will persist across reloads!');
    }

    const contents = fs.readFileSync('/test.txt', 'utf-8');
    console.log(contents);

    // const res = await git.clone({ fs, http: gitHttp, dir, url: 'https://github.com/isomorphic-git/lightning-fs' });
}

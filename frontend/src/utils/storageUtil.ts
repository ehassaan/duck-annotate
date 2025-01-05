
import { configureSingle, fs as fSys } from '@zenfs/core';
import { WebAccess } from '@zenfs/dom';


export const fs = fSys.promises;

export async function configure() {
    const dir = await window.navigator.storage.getDirectory();
    await configureSingle({ backend: WebAccess, handle: dir });
}

export async function setKey(key: string, value: string) {
    const path = '/keyval/' + key;
    try {
        await fs.mkdir('/keyval');
    }
    catch (e) {
        console.warn("Exists: ", e)
    }
    await fs.writeFile(path, value);
}

export async function getKey(key: string) {
    const path = '/keyval/' + key;
    return (await fs.readFile(path)).toString('utf8');
}

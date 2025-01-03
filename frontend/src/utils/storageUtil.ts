
import { configureSingle, fs as fSys } from '@zenfs/core';
import { WebAccess } from '@zenfs/dom';


export const fs = fSys.promises;

export async function configure() {
    const dir = await window.navigator.storage.getDirectory();
    await configureSingle({ backend: WebAccess, handle: dir });
}


export async function setKey(key: string, value: any) {
    const path = '/keyval/' + key;
    try {
        await fs.mkdir('/keyval');
    }
    catch (e) {

    }
    await fs.writeFile(path, JSON.stringify(value));
}

export async function getKey<T = any>(key: string) {
    const path = '/keyval/' + key;
    return JSON.parse((await fs.readFile(path)).toString('utf8')) as T;
}

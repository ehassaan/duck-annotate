import TreeSitter from 'web-tree-sitter';


let pyParser: TreeSitter | null = null;

let base = import.meta.env.BASE_URL;
if (!base.startsWith("/")) base = "/" + base;
if (!base.endsWith("/")) base = base + "/";
const baseUrl = `${window.location.protocol}//${window.location.host}${base}`;


TreeSitter.init({
    locateFile(scriptName: string, scriptDirectory: string) {
        console.log("Locate file: ", scriptName, scriptDirectory, baseUrl);
        return `${baseUrl}${scriptName}`;
    },
}).then(async () => {
    pyParser = new TreeSitter();
    const JavaScript = await TreeSitter.Language.load(`${baseUrl}tree-sitter-python.wasm`);

    pyParser.setLanguage(JavaScript);
});

export interface Chunk {
    file: string;
    type: string;
    name: string | null;
    comments: string | null;
    text: string;
}

async function parseFile(file: File) {
    if (!pyParser) throw Error("TreeSitter is not initialized");
    const code = await file.text();
    return pyParser.parse(code);
}

function getName(node: any): string | null {
    const nameNode = node.childForFieldName('name');
    return nameNode ? nameNode.text : null;
}

export async function scanDirectory(dir: FileSystemDirectoryHandle, pattern: string) {
    const regex = new RegExp(pattern, 'i');
    const entries = [];
    for await (const fileHandle of getFilesRecursively('.', dir)) {
        if (regex.test((fileHandle as any).relativePath)) {
            entries.push(fileHandle);
        }
    }
    return entries;
}

async function* getFilesRecursively(path: string, entry: FileSystemDirectoryHandle | FileSystemFileHandle):
    AsyncGenerator<File> {
    if (entry.kind === "file") {
        const file = await entry.getFile();
        if (file !== null) {
            (file as any).relativePath = path + "/" + file.name;
            yield file;
        }
    } else if (entry.kind === "directory") {
        for await (const handle of (entry as any).values()) {
            yield* getFilesRecursively(path + "/" + handle.name, handle);
        }
    }
}


export async function getChunks(file: File, maxChunkSize: number = 1000) {
    const tree = await parseFile(file);
    const chunks: Chunk[] = [];
    let comment: string | null = null;
    let groups: string[] = [];
    let groupLength = 0;

    for (const node of tree.rootNode.children) {
        if (node.type === 'comment') {
            if (node.text === null) continue;
            if (comment === null) {
                comment = node.text;
            } else {
                comment += '\n' + node.text;
            }
            continue;
        }

        if (node.type === 'function_definition' || node.type === 'class_definition' || node.type === 'decorated_definition') {
            chunks.push({
                file: (file as any).relativePath,
                type: 'group',
                name: null,
                comments: null,
                text: groups.join('\n'),
            });
            groups.length = 0;
            groupLength = 0;
            chunks.push({
                file: (file as any).relativePath,
                type: node.type,
                name: getName(node),
                comments: comment,
                text: node.text,
            });
        } else {
            if (groupLength + node.text.length > maxChunkSize) {
                chunks.push({
                    file: (file as any).relativePath,
                    type: 'group',
                    name: null,
                    comments: null,
                    text: groups.join('\n'),
                });
                groups.length = 0;
                groupLength = 0;
            } else {
                let group = node.text;
                if (comment !== null) {
                    group = `${comment}\n${node.text}`;
                }
                groups.push(group);
                groupLength += node.text.length;
            }
        }
        comment = null;
    }
    return chunks;
}

export async function getAllChunks(files: File[], maxChunkSize: number) {
    const chunks: Chunk[] = [];
    for (const file of files) {
        chunks.push(...await getChunks(file, maxChunkSize));
    }
    return chunks;
};;;;

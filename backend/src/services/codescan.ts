import Python from 'tree-sitter-python';
import TreeSitter from 'tree-sitter';
import * as glob from 'glob';

const pyParser = new TreeSitter();

interface Chunk {
    file: string;
    type: string;
    name: string | null;
    comments: string | null;
    text: string;
}

async function parseFile(filePath: string) {
    const code = await Bun.file(filePath).text();
    return pyParser.parse(code);
}

function getName(node: any): string | null {
    const nameNode = node.childForFieldName('name');
    return nameNode ? nameNode.text : null;
}

async function getChunks(filePath: string, maxChunkSize: number = 1500) {
    const tree = await parseFile(filePath);
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
                file: filePath,
                type: 'group',
                name: null,
                comments: null,
                text: groups.join('\n'),
            });
            groups.length = 0;
            groupLength = 0;
            console.log("Tokens: ", node.text?.length);
            chunks.push({
                file: filePath,
                type: node.type,
                name: getName(node),
                comments: comment,
                text: node.text,
            });
        } else {
            if (groupLength + node.text.length > maxChunkSize) {
                chunks.push({
                    file: filePath,
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

export type ScanLanguage = "python";

export async function scanRepo(working_dir: string,
    language: ScanLanguage,
    regexPattern: string,
    maxChunkSize: number) {

    if (language === "python") {
        pyParser.setLanguage(Python);
    }
    else {
        throw Error("Language not supported");
    }
    const chunks: Chunk[] = [];
    const files = glob.sync(regexPattern, { nodir: true, cwd: working_dir });
    for (const filePath of files) {
        console.log("File: ", filePath);
        const _chunks = await getChunks(filePath, maxChunkSize);
        chunks.push(..._chunks);
    }
    console.log(`Total Files Scanned: ${files.length}\tTotal Chunks: ${chunks.length}`);
    return {
        chunks: chunks,
        filesScanned: files.length,
        totalChunks: chunks.length,
        languagesFound: ["python"]
    };
}

import Python from 'tree-sitter-python';
import TreeSitter from 'tree-sitter';
import * as fs from 'fs';
import argparse from 'argparse';
import * as glob from 'glob';

const pyParser = new TreeSitter();
pyParser.setLanguage(Python);

interface Chunk {
    file: string;
    type: string;
    name: string | null;
    comments: string | null;
    text: string;
}

function parseFile(filePath: string) {
    const code = fs.readFileSync(filePath, 'utf8');
    return pyParser.parse(code);
}

function getName(node): string | null {
    const nameNode = node.childForFieldName('name');
    return nameNode ? nameNode.text : null;
}

function getChunks(filePath: string, maxChunkSize: number = 1000): Chunk[] {
    const tree = parseFile(filePath);
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

if (true) {
    const parser = new argparse.ArgumentParser();
    parser.add_argument('--input_pattern', { type: String, required: true });
    parser.add_argument('--max_chunk_size', { type: Number, default: 1000 });
    parser.add_argument('--output', { type: String, default: 'chunks.json' });
    const args = parser.parse_args();

    const chunks: Chunk[] = [];
    const files = glob.sync(args.input_pattern, { nodir: true });
    for (const filePath of files) {
        console.log("File: ", filePath);
        chunks.push(...getChunks(filePath, args.maxChunkSize));
    }
    console.log(`Total Files Scanned: ${files.length}\tTotal Chunks: ${chunks.length}`);
    fs.writeFileSync(args.output, JSON.stringify(chunks));
}

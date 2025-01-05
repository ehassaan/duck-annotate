
import winkNLP, { type ItemToken } from 'wink-nlp';
import model from 'wink-eng-lite-web-model';
import bm25 from "wink-bm25-text-search";
import type { Chunk } from './scanUtil';

const nlp = winkNLP(model);
const its = nlp.its;


export interface SimilarityMatch {
    name: string | null;
    text: string;
    file: string;
    type: string;
    score: number;
}

function tokenize(text: string) {
    if (!text) return [];

    const tokens: string[] = [];
    nlp.readDoc(text)
        .tokens()
        .filter((t) => (t.out(its.type) === 'word' && !t.out(its.stopWordFlag)))
        .each((t: ItemToken) => {
            const token = (t.out(its.negationFlag)) ? '!' + t.out(its.stem) : t.out(its.stem);
            const snakeCase = toSnakeCase(token);
            if (!snakeCase) return;
            snakeCase.split('_').forEach((word) => tokens.push(word));
        });
    return tokens;
}

export function createEngine() {
    const engine = bm25();
    engine.defineConfig({ fldWeights: { name: 1, file: 1, text: 1 }, ovFldNames: ['name', 'file', 'text', 'type'] });
    engine.definePrepTasks([tokenize]);
    return engine;
}

export async function indexDocs(engine: any, chunks: Chunk[]) {
    for (const [i, doc] of chunks.entries()) {
        engine.addDoc(doc, i);
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    engine.consolidate();
}

export function serializeEngine(engine: any) {
    return engine.exportJSON() as string;
}

export function deserializeEngine(data: string) {
    const engine = createEngine();
    engine.importJSON(data);
    return engine;
}

export function search(engine: any, query: string, minScore: number = 80) {
    let res = engine.search(query) as [number, string][];
    const docs = engine.getDocs();
    let results = res.map((r: any) => ({ ...docs[parseInt(r[0])].fieldValues, score: r[1] }));
    results = results.filter((r: any) => r.score >= minScore);
    return results as SimilarityMatch[];
}

function toSnakeCase(text: string) {
    const reg = /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g;
    const match = text.match(reg);
    if (!match) {
        return null;
    };
    return match.map(x => x.toLowerCase()).join('_');
}

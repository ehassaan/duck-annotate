
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';
import bm25 from "wink-bm25-text-search";
import type { Chunk } from './scanUtil';

const nlp = winkNLP(model);
const its = nlp.its;

function tokenize(text: string) {
    if (!text) return [];
    const tokens: string[] = [];
    nlp.readDoc(text)
        .tokens()
        // Use only words ignoring punctuations etc and from them remove stop words
        .filter((t) => (t.out(its.type) === 'word' && !t.out(its.stopWordFlag)))
        // Handle negation and extract stem of the word
        .each((t) => {
            const token = (t.out(its.negationFlag)) ? '!' + t.out(its.stem) : t.out(its.stem);
            toSnakeCase(token).split('_').forEach((word) => tokens.push(word));
        });
    return tokens;
}

export function initializeEngine(chunks: Chunk[]) {
    var engine = bm25();
    engine.defineConfig({ fldWeights: { name: 1, file: 1, text: 3 } });

    engine.definePrepTasks([tokenize]);

    chunks.forEach(function (doc, i) {
        engine.addDoc(doc, i);
    });
    engine.consolidate();
    return engine;
}


export function search(engine: any, query: string) {
    return engine.search(query);
}

function toSnakeCase(text: string) {
    const reg = /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g;
    return text.match(reg)
        .map(x => x.toLowerCase())
        .join('_');
}

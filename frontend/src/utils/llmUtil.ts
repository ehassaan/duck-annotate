
import { CohereClientV2 } from 'cohere-ai';
import _ from "lodash";


export async function completion(prompt: string) {
    const cohere = new CohereClientV2({
        token: import.meta.env.VITE_COHERE_API_KEY,
    });
    const response = await cohere.chat({
        model: 'command-r-plus',
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
        // responseFormat: {
            // type: 'json_object',
            // jsonSchema: responseSchema
        // }
    });
    if (response.message.content && response.message.content.length > 0) {
        console.log(response);
        return JSON.parse(_.trim(response.message.content[0].text.replace('```json', '```'), " \n`"));
    }
    else {
        console.error("Failed to parse Cohere response: ", response);
        throw new Error('Failed to parse Cohere response');
    }
    return response;
}

const responseSchema = {
    type: 'object',
    properties: {
        table_description: {
            type: 'string',
        },
        columns: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    column_name: {
                        type: 'string',
                    },
                    column_description: {
                        type: 'string',
                    },
                },
                required: ['column_name', 'column_description'],
            },
        }
    },
    required: ['table_description', 'columns'],
};
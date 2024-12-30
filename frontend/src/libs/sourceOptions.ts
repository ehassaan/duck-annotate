
export const sourceOptions = {
    postgres: [
        {
            name: "host",
            label: "host",
            type: "text",
            required: true
        },
        {
            name: "port",
            label: "port",
            type: "number",
            required: true
        },
        {
            name: "username",
            label: "username",
            type: "text",
            required: true
        },
        {
            name: "password",
            label: "password",
            type: "password",
            required: true
        }
    ]
};

export interface DynamicField {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    rules?: ((v: any) => boolean | string)[];
    options?: { title: string; value: any; }[];
    placeholder?: string | (() => string);
}
// biome-ignore lint/suspicious/noExplicitAny: this must be any
export type ArgType<T> = T extends (arg: infer U) => any ? U : never;

export default ArgType;
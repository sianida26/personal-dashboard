import type { UseQueryOptions } from "@tanstack/react-query";

// biome-ignore lint/suspicious/noExplicitAny: any is used to allow for any type of property
type ExtractDataType<T> = T extends UseQueryOptions<infer U, any, any, any>
	? U
	: never;

type ExtractQueryDataType<T> = ExtractDataType<ReturnType<T>>["data"][number];

export default ExtractQueryDataType;

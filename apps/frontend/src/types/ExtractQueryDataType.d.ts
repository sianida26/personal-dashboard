/* eslint-disable @typescript-eslint/no-explicit-any */
import { UseQueryOptions } from "@tanstack/react-query";

type ExtractDataType<T> =
	T extends UseQueryOptions<infer U, any, any, any> ? U : never;

type ExtractQueryDataType<T> = ExtractDataType<ReturnType<T>>["data"][number];

export default ExtractQueryDataType;

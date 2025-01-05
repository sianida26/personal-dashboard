export type PaginatedResponse<T extends Record<string, unknown>> = {
	data: Array<T>;
	_metadata: {
		currentPage: number;
		totalPages: number;
		perPage: number;
		totalItems: number;
	};
};

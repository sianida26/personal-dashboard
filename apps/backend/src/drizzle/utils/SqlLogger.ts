import type { Logger } from "drizzle-orm/logger";
import appLogger from "../../utils/logger";

class SqlLogger implements Logger {
	logQuery(query: string, params: unknown[]) {
		appLogger.sql(query, params);
	}
}

export default SqlLogger;

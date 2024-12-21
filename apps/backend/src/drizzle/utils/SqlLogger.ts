import { Logger } from "drizzle-orm/logger";
import appLogger from "../../utils/logger";

class SqlLogger implements Logger {
	logQuery(query: string, params: any[]) {
		appLogger.sql(query, params);
	}
}

export default SqlLogger;

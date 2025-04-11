import { eq, and, sql as rawSql } from "drizzle-orm";
import { kvStore } from "../drizzle/schema/kvStore";
import drizzle from "../drizzle";
import type { RedisKV } from "../types/RedisKV";

class TypedDrizzleRedis<KV extends Record<string, unknown>> {
	constructor(private db: typeof drizzle) {}

	async set<K extends keyof KV>(key: K, value: KV[K], ttlInSeconds?: number) {
		const expiresAt = ttlInSeconds
			? new Date(Date.now() + ttlInSeconds * 1000)
			: null;

		await this.db
			.insert(kvStore)
			.values({
				key: key as string,
				value: JSON.stringify(value),
				expiresAt,
			})
			.onConflictDoUpdate({
				target: kvStore.key,
				set: {
					value: rawSql`excluded.value`,
					expiresAt: rawSql`excluded.expires_at`,
				},
			});
	}

	async get<K extends keyof KV>(key: K): Promise<KV[K] | null> {
		const now = new Date();

		const result = await this.db.query.kvStore.findFirst({
			where: and(
				eq(kvStore.key, key as string),
				rawSql`${kvStore.expiresAt} IS NULL OR ${kvStore.expiresAt} > ${now}`,
			),
		});

		if (!result) return null;

		if (result.expiresAt && result.expiresAt <= now) {
			await this.del(key);
			return null;
		}

		const value = result.value;
		return value ? (JSON.parse(value) as KV[K]) : null;
	}

	async del<K extends keyof KV>(key: K): Promise<void> {
		await this.db.delete(kvStore).where(eq(kvStore.key, key as string));
	}

	async expire<K extends keyof KV>(
		key: K,
		ttlInSeconds: number,
	): Promise<void> {
		const expiresAt = new Date(Date.now() + ttlInSeconds * 1000);
		await this.db
			.update(kvStore)
			.set({ expiresAt })
			.where(eq(kvStore.key, key as string));
	}

	async ttl<K extends keyof KV>(key: K): Promise<number | null> {
		const result = await this.db
			.select({ expiresAt: kvStore.expiresAt })
			.from(kvStore)
			.where(eq(kvStore.key, key as string))
			.limit(1);

		const expiresAt = result[0]?.expiresAt;
		if (!expiresAt) return null;

		const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
		return ttl > 0 ? ttl : 0;
	}

	async incr<K extends keyof KV>(key: K, by = 1): Promise<number> {
		const existing = await this.get(key);

		if (existing === null) {
			await this.set(key, by as KV[K]);
			return by;
		}

		if (typeof existing !== "number") {
			throw new Error(`Value of key "${String(key)}" is not a number`);
		}

		const newValue = existing + by;
		await this.set(key, newValue as KV[K]);
		return newValue;
	}

	async decr<K extends keyof KV>(key: K, by = 1): Promise<number> {
		return this.incr(key, -by);
	}
}

// singleton instance
export const redis = new TypedDrizzleRedis<RedisKV & Record<string, unknown>>(
	drizzle,
);

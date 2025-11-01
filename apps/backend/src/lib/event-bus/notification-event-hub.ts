import { EventEmitter } from "node:events";
import type {
	NotificationRecord,
	NotificationActionLogRecord,
} from "../../drizzle/schema/notifications";

export type NotificationEventMap = {
	created: NotificationRecord;
	read: {
		userId: string;
		ids: string[];
		status: "read" | "unread";
	};
	actioned: NotificationActionLogRecord;
};

type EventKey = keyof NotificationEventMap;
type Listener<E extends EventKey> = (
	payload: NotificationEventMap[E],
) => void | Promise<void>;

type MaybePromise<T> = T | PromiseLike<T>;

export class NotificationEventHub {
	private emitter = new EventEmitter({ captureRejections: true });
	private createdListenersByUser = new Map<
		string,
		Set<Listener<"created">>
	>();

	constructor() {
		// Allow one listener per active SSE subscriber without tripping EventEmitter warnings.
		this.emitter.setMaxListeners(0);
	}

	on<E extends EventKey>(event: E, listener: Listener<E>) {
		this.emitter.on(event, listener as Listener<EventKey>);
		return () => this.off(event, listener);
	}

	once<E extends EventKey>(event: E, listener: Listener<E>) {
		this.emitter.once(event, listener as Listener<EventKey>);
		return () => this.off(event, listener);
	}

	off<E extends EventKey>(event: E, listener: Listener<E>) {
		this.emitter.off(event, listener as Listener<EventKey>);
	}

	emit<E extends EventKey>(event: E, payload: NotificationEventMap[E]) {
		this.emitter.emit(event, payload);

		if (event === "created") {
			this.dispatchCreatedListeners(
				payload as NotificationEventMap["created"],
			);
		}
	}

	removeAllListeners() {
		this.emitter.removeAllListeners();
		this.createdListenersByUser.clear();
	}

	onCreatedForUser(
		userId: string,
		listener: Listener<"created">,
	): () => void {
		const listeners = this.createdListenersByUser.get(userId);
		if (listeners) {
			listeners.add(listener);
		} else {
			this.createdListenersByUser.set(userId, new Set([listener]));
		}

		return () => this.offCreatedForUser(userId, listener);
	}

	private offCreatedForUser(
		userId: string,
		listener: Listener<"created">,
	) {
		const listeners = this.createdListenersByUser.get(userId);
		if (!listeners) return;

		listeners.delete(listener);
		if (listeners.size === 0) {
			this.createdListenersByUser.delete(userId);
		}
	}

	private dispatchCreatedListeners(payload: NotificationEventMap["created"]) {
		const listeners = this.createdListenersByUser.get(payload.userId);
		if (!listeners?.size) return;

		for (const listener of listeners) {
			try {
				const result = listener(payload);
				if (this.isPromise(result)) {
					result.catch((error) => this.handleListenerError(error));
				}
			} catch (error) {
				this.handleListenerError(error);
			}
		}
	}

	private isPromise<T>(value: MaybePromise<T>): value is PromiseLike<T> {
		return (
			typeof value === "object" &&
			value !== null &&
			"then" in value &&
			typeof (value as PromiseLike<T>).then === "function"
		);
	}

	private handleListenerError(error: unknown) {
		if (this.emitter.listenerCount("error") > 0) {
			this.emitter.emit("error", error);
		} else {
			queueMicrotask(() => {
				throw error instanceof Error ? error : new Error(String(error));
			});
		}
	}
}

const defaultHub = new NotificationEventHub();
export default defaultHub;

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

export class NotificationEventHub {
	private emitter = new EventEmitter({ captureRejections: true });

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
	}

	removeAllListeners() {
		this.emitter.removeAllListeners();
	}
}

const defaultHub = new NotificationEventHub();
export default defaultHub;

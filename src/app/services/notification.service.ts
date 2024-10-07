import { Subject } from 'rxjs';
// import { ErrorUtils }  from "@classes/errors";

export enum NotificationType {
	success, error, warning, information
}

export namespace NotificationType {
	export function values(): any {
		return {
			"success": NotificationType.success,
			"error": NotificationType.error,
			"warning": NotificationType.warning,
			"information": NotificationType.information
		};
	}
}

export interface Notification {
	type: NotificationType;
	title: string;
	message: string;
	timeout: number;
	deleted?: boolean;
	timeoutHandle?: any;
}

export class NotificationService {

	private static source = new Subject<Notification>();
	private static defaultTimeout = 8000;

	static notifications$ = NotificationService.source.asObservable();

	static success(title: string, message: string, timeout?: number): void {
		NotificationService.source.next( {
			"type": NotificationType.success,
			"title": title,
			"message": message,
			"timeout": timeout ?? NotificationService.defaultTimeout
		} );
	}

	static error(title: string, message?: string, e?: Error, timeout?: number) {

		const errorMessage = message ?? e?.message ?? "Unknown error";

		NotificationService.source.next( {
			"type": NotificationType.error,
			"title": title,
			"message": errorMessage,
			"timeout": timeout ?? NotificationService.defaultTimeout
		} );
	}

	static warning(title: string, message: string, timeout?: number): void {
		NotificationService.source.next( {
			"type": NotificationType.warning,
			"title": title,
			"message": message,
			"timeout": timeout ?? NotificationService.defaultTimeout
		} );
	}

	static info(title: string, message: string, timeout?: number): void {
		NotificationService.source.next( {
			"type": NotificationType.information,
			"title": title,
			"message": message,
			"timeout": timeout ?? NotificationService.defaultTimeout
		} );
	}
}


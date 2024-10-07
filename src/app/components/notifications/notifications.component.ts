import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Notification, NotificationType, NotificationService } from "@services/notification.service";

@Component({
	"selector": "notifications",
	"templateUrl": "./notifications.component.html",
	"styleUrls": ["./notifications.component.scss"]
})
export class NotificationComponent implements OnDestroy {

	private static readonly fadeOutDuration = 600;

	private _subscription: Subscription;
	public readonly notificationTypes = NotificationType.values();

	private _messages: Notification[] = [];

	public get notifications(): Notification[] {
		return this._messages;
	}

	public get hasNotifications(): boolean {
		return this._messages.length > 0;
	}

	/**
	* Removes the notification from the stack, so it is no longer displayed
	*/
	private expunge(notification: Notification) {
		const idx = this._messages.indexOf(notification);
		if (idx >= 0) {
			this._messages.splice(idx, 1);
		}
	}

	private removeTimeout(notification: Notification) {
		if (notification.timeoutHandle) {
			clearTimeout(notification.timeoutHandle);
			notification.timeoutHandle = undefined;
		}
	}

	/**
	* Marks the notification as deleted.
	* Sets a new timeout for 1s, after which the notification is removed from the stack.
	* A CSS animation fades the element from the display during this 1s period.
	*/
	public remove(notification: Notification) {
		if (!notification.deleted) {
			notification.deleted = true;
			this.removeTimeout(notification);
			setTimeout( () => { this.expunge(notification); }, NotificationComponent.fadeOutDuration);
		}
	}

	constructor() {
		this._subscription = NotificationService.notifications$.subscribe( notification => {
			this._messages.push(notification);
			if (notification.timeout > 0) {
				notification.timeoutHandle = setTimeout( () => { this.remove(notification); }, notification.timeout);
			}
		});
	}

	ngOnDestroy(): void {
		if (this._subscription !== undefined) {
			this._subscription.unsubscribe();
		}
	}
}

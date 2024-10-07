import { Component, OnDestroy, AfterViewInit } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ServiceLocator } from "./serviceLocator";
import { Router } from "@angular/router";

@Component({
	"template": ""
})
export abstract class BaseComponent implements OnDestroy, AfterViewInit {

	private readonly unsubscribe = new Subject<void>();
	protected readonly unsubscribe$ = this.unsubscribe.asObservable();

	protected readonly router: Router;
	
	constructor() {
		this.router = ServiceLocator.injector.get(Router);
	}
	
	protected ready() {}

	protected finalise() {}

	ngOnDestroy(): void {
		this.finalise();
		this.unsubscribe.next();
		this.unsubscribe.complete();
	}

	protected autoUnsubscribe<T>(obs: Observable<T>): Observable<T> {
		return obs.pipe(takeUntil(this.unsubscribe));
	}

	ngAfterViewInit(): void {
		setTimeout(this.ready.bind(this));
	}
}

	
import { Component, Input, EventEmitter, Output } from "@angular/core";
import { FormGroup, Validators } from "@angular/forms";
import { BaseComponent } from "@classes/baseComponent";
import { Model } from '@models/model';
import { Subject } from "rxjs";

@Component({
	"selector": "step2[model]",
	"templateUrl": "./step2.component.html",
	"styleUrls": ["./step2.component.scss"]
})
export class Step2Component extends BaseComponent {

	@Input()
	public model!: Model;

	@Input()
	public stepChange: Subject<number> = new Subject<number>();

	@Output()
	public readonly valid: EventEmitter<boolean> = new EventEmitter<boolean>();

	private readonly _group: FormGroup = new FormGroup({});

	constructor() {
		super();
	}

	private checkValid() {
		this.valid.emit(this._group.valid);
	}

	protected override ready() {
		super.ready();
		this._group.addControl("numberOfShares", this.model.numberOfShares);
		this._group.addControl("threshold", this.model.threshold);
		this.checkValid();
		this.autoUnsubscribe(this._group.statusChanges).subscribe(this.checkValid.bind(this));
	}

	public get maxThreshold(): number {
		return this.model.numberOfShares.value ?? 2;
	}

}

import { Component, Input, EventEmitter, Output } from "@angular/core";
import { FormGroup, Validators } from "@angular/forms";
import { BaseComponent } from "@classes/baseComponent";
import { Model, SecretType } from "@models/model";
import { Subject } from "rxjs";

@Component({
	"selector": "step1[model]",
	"templateUrl": "./step1.component.html",
	"styleUrls": ["./step1.component.scss"]
})
export class Step1Component extends BaseComponent {

	@Input()
	public model!: Model;

	@Input()
	public stepChange: Subject<number> = new Subject<number>();

	@Output()
	public readonly valid: EventEmitter<boolean> = new EventEmitter<boolean>();

	public readonly secretType = SecretType.values;

	private readonly _step1Group: FormGroup = new FormGroup({});

	constructor() {
		super();
	}

	protected override ready() {
		this._step1Group.addControl("bip39", this.model.bip39);
		this._step1Group.addControl("secretMessage", this.model.secretMessage);

		this.autoUnsubscribe(this.model.secretType.valueChanges).subscribe(this.secretTypeChanged.bind(this));
		this.autoUnsubscribe(this._step1Group.valueChanges).subscribe(this.checkValid.bind(this));
		this.setValidators();
		this.checkValid();
	}

	private checkValid() {
		const tests = [
			this.model.secretType.valid,
			this.model.secretType.value === SecretType.SEEDPHRASE ? this.model.bip39.valid : this.model.secretMessage.valid
		];
		this.valid.emit(tests.every(Boolean));
	}
	
	private setValidators() {
		if (this.model.secretType.value === SecretType.DATA) {
			if (!this.model.secretMessage.hasValidator(Validators.required)) {
				this.model.secretMessage.addValidators([Validators.required]);
			}
		}
		else {
			this.model.secretMessage.removeValidators([Validators.required]);
		}
		this.model.secretMessage.updateValueAndValidity();
	}

	private secretTypeChanged() {
		this.setValidators();
		this.checkValid();
	}
}

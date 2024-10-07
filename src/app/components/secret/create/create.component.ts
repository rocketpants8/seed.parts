import { ChangeDetectorRef, Component } from '@angular/core';
import { BaseComponent } from '@classes/baseComponent';
import { Model } from '@models/model';

interface Step {
	name: string;
	description: string;
}

namespace Step {
	export function make(name: string, description: string): Step {
		return { name, description };
	}
}

@Component({
	"templateUrl": "./create.component.html",
	"styleUrl": "./create.component.scss"
})
export class CreateComponent extends BaseComponent {

	public readonly steps: Step[] = [
		Step.make("Step 1", "Your Secret"),
		Step.make("Step 2", "Shares"),
		Step.make("Step 3", "Encryption"),
		Step.make("Step 4", "Finish")
	];

	public currentStep: Step = this.steps[0];

	public readonly model = new Model();

	public readonly formControls = new Model();

	constructor(private readonly cdr: ChangeDetectorRef) {
		super();
	}

	protected override ready() {}

	protected override finalise() {}

	public restart() {
		this.model.reset();
		this.currentStep = this.steps[0];
	}

	public get currentStepIdx(): number {
		return this.steps.indexOf(this.currentStep);
	}

	public previousStep() {
		const idx = this.currentStepIdx;
		if (idx > 0) {
			this.currentStep = this.steps[idx - 1];
		}
	}

	private _nextStepValid: boolean = false;

	public get nextStepValid(): boolean {
		return this._nextStepValid;
	}

	public onStepValidChange(valid: boolean) {
		this._nextStepValid = valid;
		this.cdr.detectChanges();
	}

	public nextStep() {
		const idx = this.currentStepIdx;
		if (idx < this.steps.length - 1) {
			this.currentStep = this.steps[idx + 1];
		}
	}
}

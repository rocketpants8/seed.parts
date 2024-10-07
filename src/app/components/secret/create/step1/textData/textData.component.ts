import { Component, Input } from "@angular/core";
import { Model, SecretType } from "@models/model";

@Component({
	"selector": "text-data[model]",
	"templateUrl": "./textData.component.html",
	"styleUrls": ["./textData.component.scss"]
})
export class TextDataComponent {
	@Input()
	model!: Model;

	public get placeholderText(): string {
		return this.model.secretType.value === SecretType.SEEDPHRASE ? "(Optional) Additional Information to include with your secret." : "Text Data";
	}

	public readonly secretType = SecretType.values;
}
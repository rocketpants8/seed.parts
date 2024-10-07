import { Component, Input, EventEmitter, Output } from "@angular/core";
import { FormGroup, Validators } from "@angular/forms";
import { BaseComponent } from "@classes/baseComponent";
import { Model } from '@models/model';
import { EncryptionType } from '@classes/encryptionType';
import { Subject } from "rxjs";
import { NotificationService } from "@services/notification.service";
import * as openpgp from "openpgp";

@Component({
	"selector": "step3[model]",
	"templateUrl": "./step3.component.html",
	"styleUrls": ["./step3.component.scss"]
})
export class Step3Component extends BaseComponent {

	private readonly _passwordGroup: FormGroup = new FormGroup({});

	
	@Input()
	public model!: Model;

	@Input()
	public stepChange: Subject<number> = new Subject<number>();

	@Output()
	public readonly valid: EventEmitter<boolean> = new EventEmitter<boolean>();

	constructor() {
		super();
	}

	private checkValid() {
		this.valid.emit(this._passwordGroup.valid);
	}

	protected override ready() {
		this._passwordGroup.addControl("password", this.model.password);
		this._passwordGroup.addControl("confirmPassword", this.model.confirmPassword);


		this.checkValid();
		super.ready();
		this.autoUnsubscribe(this._passwordGroup.statusChanges).subscribe(this.checkValid.bind(this));
	}

	public readonly encryptionTypeList = EncryptionType.list;
	public readonly encryptionType = EncryptionType.values;

	public showPassword: boolean = false;
	public showConfirmPassword: boolean = false;

	public togglePasswordVisibility() {
		this.showPassword = !this.showPassword;
	}

	public isDragOver: boolean = false;

	public onDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.isDragOver = true;
	}

	public onDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.isDragOver = false;
	}

	public onDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.isDragOver = false;
		if (event.dataTransfer?.files) {
			this.handleFile(event.dataTransfer.files[0]);
		}
	}

	public onFileSelected(event: Event) {
		const element = event.target as HTMLInputElement;
		if (element.files?.length) {
			this.handleFile(element.files[0]);
		}
	}

	private async isPublicKey(content: string): Promise<boolean> {
		try {
			await openpgp.readKey({ "armoredKey": content });
			return true;
		}
		catch (error) {
			console.log(error);
			return false;
		}
	}

	private handleFile(file: File) {
		const reader = new FileReader();
		reader.onload = async (e: ProgressEvent<FileReader>) => {
			const content = e.target?.result as string;

			if (await this.isPublicKey(content)) {
				this.model.publicKey.setValue(content);
				this.publicKeyFilename = file.name;
			}
			else {
				NotificationService.error("Invalid public key file", "The file you selected is not a valid RSA public key.");
				this.model.publicKey.setValue(null);
				this.publicKeyFilename = null;
			}
		};

		reader.readAsText(file);
	}

	private _publicKeyFilename: string | null = null;

	public get publicKeyFilename(): string | null {
		return this._publicKeyFilename;
	}

	private set publicKeyFilename(value: string | null) {
		this._publicKeyFilename = value;
	}

	public toggleConfirmPasswordVisibility() {
		this.showConfirmPassword = !this.showConfirmPassword;
	}
}

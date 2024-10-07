import { FormControl, FormArray, Validators, Validator, ValidationErrors, AbstractControl, ValidatorFn } from '@angular/forms';
import { ListItem } from '@classes/listItem';
import { Bip39Language } from '@classes/bip39WordList';
import { EncryptionType } from '@classes/encryptionType';

export enum SecretType {
	SEEDPHRASE = 'seedphrase',
	DATA = 'data'
}

export namespace SecretType {
	export const values: { [key: string]: SecretType } = {
		"seedphrase": SecretType.SEEDPHRASE,
		"data": SecretType.DATA
	}
}

function thresholdValidator(numShares: AbstractControl): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const threshold = control.value;
		const numberOfShares = numShares.value;

		if (!threshold || !numberOfShares) {
			return null;
		}

		if (threshold > numberOfShares) {
			return { "thresholdTooHigh": true };
		}

		if (numberOfShares <= 2) {
			return { "thresholdTooLow": true };
		}

		return null;
	}
}

function passwordMatchValidator(passwordControl: AbstractControl): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const password = passwordControl.value;
		const confirmPassword = control.value;

		if (password !== confirmPassword) {
			return { "passwordMismatch": true };
		}

		return null;
	};
}

export enum DownloadFormat {
	PLAINTEXT = 'plaintext',
	MARKDOWN = 'markdown',
	// TAR = 'tar',
	// TAR_GZ = 'tar.gz',
	ZIP = 'zip'
}

export namespace DownloadFormat {
	export const list: ListItem<DownloadFormat>[] = [
		ListItem.from('Plain Text', DownloadFormat.PLAINTEXT),
		ListItem.from('Markdown', DownloadFormat.MARKDOWN),
		// ListItem.from('Tar Archive', DownloadFormat.TAR),
		// ListItem.from('GZipped Tar Archive', DownloadFormat.TAR_GZ),
		ListItem.from('ZIP Archive', DownloadFormat.ZIP)
	];

	export const values: { [key: string]: DownloadFormat } = {
		"plaintext": DownloadFormat.PLAINTEXT,
		"markdown": DownloadFormat.MARKDOWN,
		// "tar": DownloadFormat.TAR,
		// "tar.gz": DownloadFormat.TAR_GZ,
		"zip": DownloadFormat.ZIP
	}
}


export class Model {
	public readonly secretMessage = new FormControl<string|null>(null, { "validators": [Validators.required] });
	public readonly numberOfShares = new FormControl<number>(5, { "nonNullable": true, "validators": [Validators.required, Validators.min(2)] });
	public readonly threshold = new FormControl<number>(3, { "nonNullable": true, "validators": [Validators.required, Validators.min(2)] });
	public readonly bip39Language = new FormControl<Bip39Language>(Bip39Language.english, { "nonNullable": true, "validators": [Validators.required] });
	public readonly bip39 = new FormArray<FormControl<string>>([]);
	public readonly wordCount = new FormControl<number>(12, { "nonNullable": true, "validators": [Validators.required] });
	public readonly encryptionType = new FormControl<EncryptionType>(EncryptionType.PASSWORD, { "nonNullable": true, "validators": [Validators.required] });
	public readonly password = new FormControl<string | null>(null);
	public readonly confirmPassword = new FormControl<string|null>(null);
	public readonly secretType = new FormControl<SecretType|null>(null, { "validators": [Validators.required] });
	public readonly publicKey = new FormControl<string|null>(null);

	public readonly downloadFormat = new FormControl<DownloadFormat>(DownloadFormat.ZIP, { "nonNullable": true, "validators": [Validators.required] });
	public readonly includeInstructions = new FormControl<boolean>(true, { "nonNullable": true });
	public readonly includeShareInfo = new FormControl<boolean>(true, { "nonNullable": true });

	constructor() {
		this.wordCount.valueChanges.subscribe(this.buildWordControls.bind(this));
		this.buildWordControls(this.wordCount.value);
		this.threshold.addValidators([thresholdValidator(this.numberOfShares)]);
		this.confirmPassword.addValidators([passwordMatchValidator(this.password)]);

		this.bip39Language.setValue(Bip39Language.preferredLanguage());
		this.setEncryptionType(this.encryptionType.value);
	}

	private buildWordControls(value: number) {
		while (this.bip39.controls.length < value) {
			this.bip39.push(new FormControl<string>('', { "nonNullable": true, validators: [Validators.required] }));
		}
		while (this.bip39.controls.length > value) {
			this.bip39.removeAt(this.bip39.controls.length - 1);
		}
	}

	public reset() {
		this.secretMessage.setValue(null);
		this.numberOfShares.setValue(5);
		this.threshold.setValue(3);
		this.bip39.clear();
		this.wordCount.setValue(12);
	}

	public setEncryptionType(value: EncryptionType) {
		switch (value) {
			case EncryptionType.NONE:
				this.password.clearValidators();
				this.confirmPassword.clearValidators();
				break;
			case EncryptionType.PASSWORD:
				this.password.setValidators([Validators.required]);
				this.confirmPassword.setValidators([Validators.required]);
				break;
			case EncryptionType.KEY:
				this.password.clearValidators();
				this.confirmPassword.clearValidators();
				break;
		}
	}

	public get dataToEncrypt(): string {
		if (this.secretType.value === SecretType.SEEDPHRASE) {
			const info = this.secretMessage.value ?? '';
			const seedPhrase = this.bip39.value.reduce((acc, cur, idx) => {
				acc += `${idx + 1}. ${cur}\n`;
				return acc;
			}, "");
			
			return [info, seedPhrase].filter(Boolean).join("\n\n");
		}
		else {
			return this.secretMessage.value ?? '';
		}
	}
}
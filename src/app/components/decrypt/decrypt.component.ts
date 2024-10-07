import { Component } from "@angular/core";
import { BaseComponent } from "@classes/baseComponent";
import { DecryptModel } from "@models/decryptModel";
import { combine } from "shamir-secret-sharing";
import { Buffer } from "buffer";
import { Decrypt } from "@classes/decrypt";
import { EncryptionType } from '@classes/encryptionType';
import { assert } from "@classes/assert";
import { NotificationService } from "@services/notification.service";
import * as openpgp from "openpgp";
@Component({
	"templateUrl": "./decrypt.component.html",
	"styleUrl": "./decrypt.component.scss"
})
export class DecryptComponent extends BaseComponent {

	private readonly pgpHeader = "-----BEGIN PGP MESSAGE-----";
	private _encryptionType: EncryptionType = EncryptionType.NONE;
	private _combinedShares: string|null = null;

	public readonly model = new DecryptModel();
	private readonly decrypt = new Decrypt(this.model);

	public get encryptionType(): EncryptionType {
		return this._encryptionType;
	}

	constructor() {
		super();

		// this.model.devSettings();
		this.decode();
		this.autoUnsubscribe(this.model.shares.valueChanges).subscribe(this.decode.bind(this));
	}

	private stringToUint8Array(str: string): Uint8Array {
		const buffer = Buffer.from(str, 'base64');
		return new Uint8Array(buffer);
	}

	private uint8ArrayToString(bytes: Uint8Array): string {
		return new TextDecoder().decode(bytes);
	}

	private async combineShares(shares: string[]): Promise<string|null> {
		try {
			const shareBytes = shares.map(this.stringToUint8Array);
			const combined = await combine(shareBytes);
			return this.uint8ArrayToString(combined);
		}
		catch (error) {
			return null;
		}
	}

	private async decode(): Promise<void> {
		const shares = this.model.shares.value.filter(Boolean);
		if (shares.length < 2) {
			this.model.secret.setValue(null);
			return;
		}

		this._combinedShares = await this.combineShares(shares);
		if (this._combinedShares === null) {
			this.model.secret.setValue(null);
			return;
		}

		if (this._combinedShares.startsWith(this.pgpHeader)) {
			this.model.secret.setValue(null);

			if (await this.decrypt.isEncryptedWithPubKey(this._combinedShares)) {
				this._encryptionType = EncryptionType.KEY;
			}
			else {
				this._encryptionType = EncryptionType.PASSWORD;
			}
		}
		else {
			this.model.secret.setValue(this._combinedShares);
		}
	}

	protected override ready() {}

	public addShare() {
		this.model.addShare();
	}

	public removeShare(index: number) {
		this.model.removeShare(index);
	}

	public async applyCredentials(): Promise<void> {
		try {
			assert.hasValue(this._combinedShares);
			if (this.model.keyPasswordRequired.value || this.encryptionType === EncryptionType.PASSWORD) {
				assert.hasValue(this.model.password.value);
			}
		}
		catch (e) {
			return;
		}

		try {
			switch (this.encryptionType) {
				case EncryptionType.PASSWORD:
					this.model.secret.setValue(await this.decrypt.decryptWithPassword(this._combinedShares));
					break;
				case EncryptionType.KEY:
					this.model.secret.setValue(await this.decrypt.decryptWithKey(this._combinedShares));
				break;
			}
		}
		catch (e) {
			this.model.secret.setValue(null);
			NotificationService.error("Failed to decrypt", "The credentials you provided are invalid.");
		}
	}

	public onPrivateKeyFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			this.handlePrivateKeyFile(input.files[0]);
		}
	}

	public onShareFileSelected(event: Event, index: number) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const file = input.files[0];
			const reader = new FileReader();
			reader.onload = (e: ProgressEvent<FileReader>) => {
				if (e.target?.result) {
					const fileContent = e.target.result as string;
					this.model.shares.controls[index].setValue(fileContent.trim());
				}
			};
			reader.readAsText(file);
		}
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
			this.handlePrivateKeyFile(event.dataTransfer.files[0]);
		}
	}

	private async isPrivateKey(content: string): Promise<boolean> {
		try {
			const key = await openpgp.readPrivateKey({ "armoredKey": content });
			this.model.keyPasswordRequired.setValue(!key.isDecrypted());

			return true;
		} catch (error) {
			console.log(error);
			return false;
		}
	}

	private handlePrivateKeyFile(file: File) {
		this.model.secret.setValue(null);
		const reader = new FileReader();
		reader.onload = async (e: ProgressEvent<FileReader>) => {
			const content = e.target?.result as string;

			if (await this.isPrivateKey(content)) {
				this.model.privateKey.setValue(content);
				this.privateKeyFilename = file.name;
				if (!this.model.keyPasswordRequired.value) {
					this.applyCredentials();
				}
			} else {
				NotificationService.error("Invalid private key file", "The file you selected is not a valid RSA private key.");
				this.model.privateKey.setValue(null);
				this.privateKeyFilename = null;
			}
		};

		reader.readAsText(file);
	}

	private _privateKeyFilename: string | null = null;

	public get privateKeyFilename(): string | null {
		return this._privateKeyFilename;
	}

	private set privateKeyFilename(value: string | null) {
		this._privateKeyFilename = value;
	}

	public get privateKeyPasswordRequired(): boolean {
		return this.model.privateKey.value !== null && (this.model.keyPasswordRequired.value ?? false);
	}

	
	public readonly encryptionTypes = EncryptionType.values;
}
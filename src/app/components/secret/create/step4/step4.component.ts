import { Component, Input, EventEmitter, Output } from "@angular/core";
import { BaseComponent } from "@classes/baseComponent";
import { Model, DownloadFormat } from '@models/model';
import { EncryptionType } from '@classes/encryptionType';
import { Subject } from "rxjs";
import { Encrypt, NoEncrypt, PasswordEncrypt, PKEncrypt } from "@classes/encrypt";
import { assert } from "@classes/assert";
import { split } from "shamir-secret-sharing";
import { Buffer } from "buffer";
import { ListItem } from "@classes/listItem";
import { ArchiveService } from "@services/archive.service";
import { NotificationService } from "@services/notification.service";

@Component({
	"selector": "step4[model]",
	"templateUrl": "./step4.component.html",
	"styleUrls": ["./step4.component.scss"]
})
export class Step4Component extends BaseComponent {

	private readonly _shares: string[] = [];

	@Input()
	public model!: Model;

	@Input()
	public stepChange: Subject<number> = new Subject<number>();

	constructor(private readonly archiveService: ArchiveService) {
		super();
	}

	private getEncryptor(): Encrypt {
		switch (this.model.encryptionType.value) {
			case EncryptionType.NONE: return new NoEncrypt();
			case EncryptionType.PASSWORD: return new PasswordEncrypt();
			case EncryptionType.KEY: return new PKEncrypt();
		}
	}

	private getCredentials(): string|null {
		switch (this.model.encryptionType.value) {
			case EncryptionType.NONE: return null;
			case EncryptionType.PASSWORD: return this.model.password.value;
			case EncryptionType.KEY: return this.model.publicKey.value;
		}
	}

	private toUint8Array(str: string): Uint8Array {
		return new TextEncoder().encode(str);
	}

	private async generateShares(): Promise<void> {
		const encryptor = this.getEncryptor();
		const credentials = this.getCredentials();
		assert.hasValue(this.model.dataToEncrypt);
		const encryptedSecret = await encryptor.encrypt(this.model.dataToEncrypt, credentials ?? undefined);

		const secretBytes = this.toUint8Array(encryptedSecret);
		const shares = await split(secretBytes, this.model.numberOfShares.value, this.model.threshold.value);
		this._shares.push(...shares.map((share: Uint8Array) => Buffer.from(share).toString('base64')));
		Object.freeze(this._shares);
	}

	protected override ready() {
		super.ready();

		this.generateShares();
	}

	public get shares(): string[] {
		return this._shares;
	}

	public get allFormats(): ListItem<DownloadFormat>[] {
		return DownloadFormat.list;
	}

	public readonly downloadFormat = DownloadFormat.values;

	public async downloadShares(): Promise<void> {
		switch (this.model.downloadFormat.value) {
			case DownloadFormat.PLAINTEXT: {
				const plaintext = await this.archiveService.plaintextFile(this.shares, this.model.includeInstructions.value, this.model.includeShareInfo.value, this.model);
				const blob = new Blob([plaintext], { type: 'text/plain' });
				this.saveAs(blob, 'shares.txt');
				break;
			}
			case DownloadFormat.MARKDOWN: {
				const markdown = await this.archiveService.markdownFile(this.shares, this.model.includeInstructions.value, this.model.includeShareInfo.value, this.model);
				const blob = new Blob([markdown], { type: 'text/markdown' });
				this.saveAs(blob, 'shares.md');
				break;
			}
			case DownloadFormat.ZIP: {
				const zip = await this.archiveService.createZipFile(this.shares, this.model.includeInstructions.value, this.model.includeShareInfo.value, this.model);
				this.saveAs(zip, 'shares.zip');
				break;
			}
			default:
				throw new Error("Not implemented");
		}
	}

	public copyShare(idx: number) {
		const share = this._shares[idx];
		navigator.clipboard.writeText(share);
		NotificationService.success("Copied to clipboard", "The share has been copied to your clipboard", 5000);
	}

	private saveAs(blob: Blob, arg1: string) {
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.style.display = 'none';
		a.href = url;
		a.download = arg1;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	}

}


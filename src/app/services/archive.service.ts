import { Injectable } from '@angular/core';
import JSZip, { files } from 'jszip';
import { Model } from '@models/model';
import { EncryptionType } from '@classes/encryptionType';

@Injectable({
	"providedIn": "root"
})
export class ArchiveService {
	
	public async createZipFile(shares: string[], includeInstructions: boolean, includeShareInfo: boolean, model: Model): Promise<Blob> {
		const zip = new JSZip();

		let readme = "";

		if (includeInstructions) {
			readme += `# Seed.Parts Decode Instructions

1. Open the Seed.Parts app in your browser.
2. Go to the 'Decode' tab.
3. Paste the shares into the 'Shares' field.
4. Click 'Decode'.`;
		}

		if (includeShareInfo) {
			readme += `## Share Information

At least ${model.threshold.value} of ${model.numberOfShares.value} shares are required to decode the secret.

`;
		}

		if (readme.length > 0) {
			zip.file("README.md", readme);
		}

		shares.forEach((share, idx) => {
			zip.file(`share-${idx + 1}.txt`, share);
		});

		return await zip.generateAsync({"type": "blob"});
	}

	public async plaintextFile(shares: string[], includeInstructions: boolean, includeShareInfo: boolean, model: Model): Promise<string> {

		let result = "";

		if (includeInstructions) {
			result += `Seed.Parts Decode Instructions:

1. Open the Seed.Parts app in your browser.
2. Go to the 'Decode' tab.
3. Paste the shares into the 'Shares' field.
4. Click 'Decode'.

`;
		}

		if (includeShareInfo) {
			result += `Share Information:

At least ${model.threshold.value} of ${model.numberOfShares.value} shares are required to decode the secret.

`;

			switch (model.encryptionType.value) {
				case EncryptionType.NONE:
					result += "This secret is not encrypted.\n\n";
					break;
				case EncryptionType.PASSWORD:
					result += "This secret is encrypted with a password. You will need this password to decode the secret.\n\n";
					break;
				case EncryptionType.KEY:
					result += "This secret is encrypted with a public key. You will need the corresponding private key (and key password, if applicable) to decode the secret.\n\n";
					break;
			}
		}

		for (let idx = 0; idx < shares.length; idx++) {
			result += `Share ${idx + 1}:\n${shares[idx]}\n\n`;
		}

		return result;
	}

	public async markdownFile(shares: string[], includeInstructions: boolean, includeShareInfo: boolean, model: Model): Promise<string> {
		let result = "";

		if (includeInstructions) {
			result += `# Seed.Parts Decode Instructions

1. Open the Seed.Parts app in your browser.
2. Go to the 'Decode' tab.
3. Paste the shares into the 'Shares' field.
4. Click 'Decode'.

`;
		}

		if (includeShareInfo) {
			result += `## Share Information

At least **${model.threshold.value}** shares are required to decode the secret.

`;

			switch (model.encryptionType.value) {
				case EncryptionType.NONE:
					result += "This secret is **not encrypted**.\n\n";
					break;
				case EncryptionType.PASSWORD:
					result += "This secret is **encrypted with a password**. You will need this password to decode the secret.\n\n";
					break;
				case EncryptionType.KEY:
					result += "This secret is **encrypted with a public key**. You will need the corresponding private key (and key password, if applicable) to decode the secret.\n\n";
					break;
			}
		}

		result += "# Shares\n\n";

		for (let idx = 0; idx < shares.length; idx++) {
			result += `## Share ${idx + 1}\n\`\`\`\n${shares[idx]}\n\`\`\`\n\n`;
		}

		return result;
	}
}
import * as openpgp from "openpgp";
import { DecryptModel } from "@models/decryptModel";
import { assert } from "@classes/assert";
import { PrivateKey } from "openpgp";

export class Decrypt {

	constructor(private readonly model: DecryptModel) {}

	public async isEncryptedWithPubKey(armouredMessage: string): Promise<boolean> {
		const message: openpgp.Message<string> = await openpgp.readMessage({"armoredMessage": armouredMessage});
		const packets = message.packets;

		const pubKeyPackets = packets.filterByTag(openpgp.enums.packet.publicKeyEncryptedSessionKey);
		return pubKeyPackets.length > 0;
	}

	public async decryptWithPassword(armouredMessage: string): Promise<string> {
		const password = this.model.password.value;
		assert.hasValue(password, "Password is required");

		const message: openpgp.Message<string> = await openpgp.readMessage({"armoredMessage": armouredMessage});
		const decryptionResult = await openpgp.decrypt({
			"message":message,
			"passwords": [password]
		});
		return decryptionResult.data.toString();
	}

	private async getPrivateKey(): Promise<PrivateKey> {
		const armouredPrivateKey = this.model.privateKey.value;
		assert.hasValue(armouredPrivateKey, "Private key is required");
		const parsedPrivateKey = await openpgp.readPrivateKey({ "armoredKey": armouredPrivateKey });

		if (this.model.keyPasswordRequired.value) {
			const keyPassword = this.model.password.value;
			assert.hasValue(keyPassword, "Private key password is required");

			return await openpgp.decryptKey({
				"privateKey": parsedPrivateKey,
				"passphrase": keyPassword
			});
		}

		return parsedPrivateKey;
	}

	public async decryptWithKey(armouredMessage: string): Promise<string> {	
		const message: openpgp.Message<string> = await openpgp.readMessage({ "armoredMessage": armouredMessage });
		const privateKey = await this.getPrivateKey();

		const decryptionResult = await openpgp.decrypt({
			"message": message,
			"decryptionKeys": [privateKey]
		});

		return decryptionResult.data.toString();
	}
}
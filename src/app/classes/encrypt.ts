import * as openpgp from "openpgp";
import { assert } from "./assert";

export abstract class Encrypt {

	public abstract encrypt(secret: string, credentials?: string): Promise<string>;

}

export class NoEncrypt extends Encrypt {

	constructor() {
		super();
	}

	public override async encrypt(secret: string): Promise<string> {
		return secret;
	}
}

export class PasswordEncrypt extends Encrypt {

	constructor() {
		super();
	}

	/**
	 * Encrypts a secret message using a password.
	 * @param secret The secret message to be encrypted.
	 * @param password The password used for encryption.
	 * @returns A promise that resolves to the encrypted message as a string.
	 */
	public override async encrypt(secret: string, password: string): Promise<string> {
		assert(secret.length > 0, "Secret cannot be empty");
		assert.hasValue(password, "Password cannot be empty");
		assert(password.length > 0, "Password cannot be empty");	

		const msg = await openpgp.createMessage({"text": secret});
		const encrypted = await openpgp.encrypt({
			"message": msg,
			"passwords": [password]
		});
		return encrypted.toString();
	}
}

export class PKEncrypt extends Encrypt {

	constructor() {
		super();
	}

	/**
	 * Encrypts a secret message using a public key.
	 * @param secret The secret message to be encrypted.
	 * @param publicKey An armored public key used for encryption, usually read from the key's PEM file
	 * @returns A promise that resolves to the encrypted message as a string.
	 */
	public override async encrypt(secret: string, publicKey: string): Promise<string> {
		assert.hasValue(publicKey, "Public key cannot be empty");
		assert(publicKey.length > 0, "Public key cannot be empty");
		const msg = await openpgp.createMessage({"text": secret});
		const key = await openpgp.readKey({"armoredKey": publicKey.trim() });

		const encrypted = await openpgp.encrypt({
			"message": msg,
			"encryptionKeys": key
		});

		return encrypted.toString();
	}
}
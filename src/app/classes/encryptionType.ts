import { ListItem } from "@classes/listItem";


export enum EncryptionType {
	NONE = 'none',
	PASSWORD = 'password',
	KEY = 'key'
}

export namespace EncryptionType {
	export const list: ListItem<EncryptionType>[] = [
		ListItem.from('No encryption', EncryptionType.NONE),
		ListItem.from('Password', EncryptionType.PASSWORD),
		ListItem.from('RSA Key Pair', EncryptionType.KEY)
	];

	export const values: { [key: string]: EncryptionType; } = {
		"none": EncryptionType.NONE,
		"password": EncryptionType.PASSWORD,
		"key": EncryptionType.KEY
	};
}

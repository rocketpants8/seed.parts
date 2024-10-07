export interface ListItem<T> {
	label: string;
	value: T;
}

export namespace ListItem {
	export function from<T>(label: string, value: T): ListItem<T> {
		return { label, value };
	}
}

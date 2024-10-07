export function assert(value: unknown, msg?: string): asserts value {
	if (!value) {
		throw new Error(msg);
	}
}

export namespace assert {

	/**
	* Asserts that the provided value is not null or undefined
	*/
	export function hasValue<T>(value: T | null | undefined, msg?: string): asserts value is NonNullable<T> {
		if (<T>value === null || <T>value === undefined) {
			throw new Error(msg);
		}
	}

	/**
	* Ensures the provided value is truthy
	*/
	export function truthy(value: unknown, msg?: string): asserts value {
		if (!value) {
			throw new Error(msg);
		}
	}

	/**
	* Ensures the provided value is exactly true
	*/
	export function isTrue(value: unknown, msg?: string): asserts value is true {
		if (value !== true) {
			throw new Error(msg);
		}
	}

	/**
	* Ensures the provided value is not truthy
	*/
	export function not(value: unknown, msg?: string): asserts value is false | null | undefined {
		if (!!value) {
			throw new Error(msg);
		}
	}
}

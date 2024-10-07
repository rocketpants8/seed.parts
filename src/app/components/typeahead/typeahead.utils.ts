export enum Key {
	Backspace = 8,
	Tab = 9,
	Enter = 13,
	Shift = 16,
	Escape = 27,
	ArrowLeft = 37,
	ArrowRight = 39,
	ArrowUp = 38,
	ArrowDown = 40,
	MacCommandLeft = 91,
	MacCommandRight = 93,
	MacCommandFirefox = 224
}

export namespace TypeAhead {

	export const NO_INDEX = -1;

	export function validateNonCharKeyCode(keyCode: number) {
		return [
			Key.Enter,
			Key.Tab,
			Key.Shift,
			Key.ArrowLeft,
			Key.ArrowUp,
			Key.ArrowRight,
			Key.ArrowDown,
			Key.MacCommandLeft,
			Key.MacCommandRight,
			Key.MacCommandFirefox
		].every(codeKey => codeKey !== keyCode);
	}

	export function validateArrowKeys(keyCode: number) {
		return [Key.ArrowDown, Key.ArrowUp].includes(keyCode);
	}

	export function isIndexActive(index: number, currentIndex: number) {
		return index === currentIndex;
	}

	export function isEnterKey(event: KeyboardEvent) {
		return event.keyCode === Key.Enter;
	}

	export function isTabKey(event: KeyboardEvent) {
		return event.keyCode === Key.Tab;
	}

	export function isEscapeKey(event: KeyboardEvent) {
		return event.keyCode === Key.Escape;
	}

	export function resolveNextIndex(currentIndex: number, stepUp: boolean, listLength = 10) {
		const step = stepUp ? 1 : -1;
		const topLimit = listLength - 1;
		const bottomLimit = 0;
		const currentResultIndex = currentIndex + step;

		let resultIndex = currentResultIndex;
		if (currentResultIndex === topLimit + 1) {
			resultIndex = bottomLimit;
		}
		if (currentResultIndex === bottomLimit - 1) {
			resultIndex = topLimit;
		}
		return resultIndex;
	}

	export function hasCharacters(query: string) {
		return query.length > 0;
	}

	export function toFormControlValue(e: any) {
		return e.target.value;
	}

	export function resolveItemValue(item: string | any, fieldsToExtract: string[], caseSensitive = false) {
		let newItem;
		if (!item.hasOwnProperty('length')) {
			const fields = !fieldsToExtract.length ? Object.keys(item) : fieldsToExtract;
			newItem = fields.map(key => `${item[key]}`);
		} else {
			newItem = [item];
		}
		return caseSensitive ? newItem : newItem.map( value => value.toLowerCase() );
	}
}

import { Component, Input } from "@angular/core";
import { Model } from "@models/model";
import { getBip39WordMap, Bip39Language } from "@classes/bip39WordList";
import { assert } from "@classes/assert";

class WordList {

	private firstCharacter: string = '';

	public language: Bip39Language = Bip39Language.english;
	public list: string[] = [];

	constructor() {
	}

	public listFrom(value: string): void {
		if (!value.match(/^[A-Za-z]/)) {
			this.list = [];
			return;
		}

		if (this.firstCharacter !== value.charAt(0)) {
			const bip39WordMap = getBip39WordMap(this.language);

			this.firstCharacter = value.charAt(0);
			this.list = bip39WordMap.get(this.firstCharacter) ?? [];
		}
	}
}

@Component({
	"selector": "seedphrase[model]",
	"templateUrl": "./seedphrase.component.html",
	"styleUrls": ["./seedphrase.component.scss"]
})
export class SeedphraseComponent {

	private _model?: Model;

	@Input()
	public set model(value: Model) {
		this._model = value;
		this.wordList.language = value.bip39Language.value;
	};

	public get model(): Model {
		assert.hasValue(this._model);
		return this._model;
	}

	public wordList = new WordList();

	public getWordList(inputText: string): void {
		return this.wordList.listFrom(inputText);
	}

	public seedColumn(column: number, index: number): boolean {
		const wordsPerColumn = this.model.bip39.controls.length / 3;
		return index >= (wordsPerColumn * column) && index < (wordsPerColumn * (column + 1));
	}

	public readonly bip39Languages = Bip39Language.listItems;
}

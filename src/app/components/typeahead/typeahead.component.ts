import { ChangeDetectorRef, Renderer2, QueryList, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, AfterViewInit, Output, TemplateRef, ViewChild, ViewChildren, ViewContainerRef } from '@angular/core';
import { of, from, Observable, Subject } from 'rxjs';
import { concatWith, debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap, take } from 'rxjs/operators';
import { Key, TypeAhead } from "./typeahead.utils";
import { hasValue } from "@utils";

interface Unselectable {
	[k: symbol]: boolean;
}

export type SearchFunc<T> = (searchTerm: string, caseSensitive?: boolean) => Promise<T[]>;

export namespace Unselectable {
	const unselectableKey: symbol= Symbol.for("unselectable");

	export function makeUnselectable<T extends any>(value: T): T & Unselectable {
		return Object.defineProperty(value, unselectableKey, {"value": true, "writable": false}) as T & Unselectable;
	}

	export function isUnselectable(value: Object): boolean {
		if (!hasValue(value)) {
			return true;
		}
		if (typeof value === 'object') {
			return Reflect.get(value, unselectableKey) !== undefined;
		}
		return false;
	}
}

@Component({
	"selector": "[typeahead]",
	"templateUrl": "./typeahead.component.html",
	"styleUrls": ["./typeahead.component.scss"]
})
export class TypeaheadComponent implements OnInit, OnDestroy, AfterViewInit {

	private _taList: any[] = [];

	@Input()
	taItemTpl!: TemplateRef<any>;

	@Input()
	taSearchService: SearchFunc<any>|undefined = undefined;

	/**
	* Send a fake key press event.
	* Used to force the results to refresh when the list has changed, or to
	* ensure that the suggestions display appropriately on focus.
	*/
	private fakeKeyPress(keyCode: number) {
		this.keyup$.next(<KeyboardEvent>{"keyCode": keyCode, "target": this.element.nativeElement});
	}

	@Input()
	public set taList(value: any[]) {
		if (this._taList !== value) {
			this._taList = value;
			this.fakeKeyPress(0);
		}
	}

	public get taList(): any[] {
		return this._taList;
	}

	@Input()
	taListItemField: string[] = [];

	@Input()
	taListItemLabel: string = '';

	@Input()
	taDebounce: number = 300;

	@Input()
	taAllowEmpty: boolean = false;

	@Input()
	taCaseSensitive: boolean = false;

	@Input()
	taDisplayOnFocus: boolean = false;

	@Input()
	taHideNoResults: boolean = false;

	@Input()
	taMinSearchLength: number = 1;

	@Input()
	taNoResultsMessage: string = 'No results';

	@Output()
	taSelected = new EventEmitter<string | any>();

	@ViewChild("suggestionsTemplate", {"static": true})
	suggestionsTemplate!: TemplateRef<any>;

	@ViewChild("resultsSection")
	resultsSection!: ElementRef<HTMLElement>;

	@ViewChildren('activeResult')
	private resultElementList: QueryList<any>|undefined;

	@Input()
	public set verticalPadding(value: string) {
		document.documentElement.style.setProperty('--vertical-padding', value);
	}

	@Input()
	public set horizontalPadding(value: string) {
		document.documentElement.style.setProperty('--horizontal-padding', value);
	}

	@Input()
	public onlyMatchStart: boolean = false;

	private suggestionIndex = 0;
	private activeResult = '';
	private searchQuery = '';
	private resultsAsItems: any[] = [];
	private keydown$ = new Subject<KeyboardEvent>();
	private keyup$ = new Subject<KeyboardEvent>();
	private _showSuggestions = false;
	private _results: any[] = [];
	private _unsubscribe: Subject<void> = new Subject<void>();
	private focusHandlerUnsubscribe: () => void;
	private _forceRefresh: boolean = false;

	public get results(): any[] {
		return this._results || [];
	}

	public get nativeElement(): HTMLInputElement {
		return <HTMLInputElement> this.element.nativeElement;
	}

	constructor(
		public readonly element: ElementRef,
		private viewContainer: ViewContainerRef,
		private cdr: ChangeDetectorRef,
		private renderer: Renderer2) {

		this.verticalPadding = '0.5rem'; // Default
		this.horizontalPadding = '0.5rem'; // Default

		// Respond to focus events so we can force the drop-down to display if required
		this.focusHandlerUnsubscribe = this.renderer.listen(this.element.nativeElement, 'focus', this.onFocus.bind(this));
	}

	private onFocus() {
		if (this.taDisplayOnFocus) {
			this.searchQuery = this.element.nativeElement.value;
			this.suggest(this.searchQuery).pipe(take(1)).subscribe((results: string[] | any) => {
				this.assignResults(results);
				this.displaySuggestions();
			});
		}
	}

	ngOnInit() {
		this.filterEnterEvent(this.keydown$);
		this.listenAndSuggest(this.keyup$);
		this.navigateWithArrows(this.keydown$);
		this.renderTemplate();
	}

	ngOnDestroy() {
		this.keydown$.complete();
		this.keyup$.complete();

		if (this.focusHandlerUnsubscribe) {
			this.focusHandlerUnsubscribe();
		}

		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	ngAfterViewInit() {
		// Add an "autocomplete=off" attribute
		this.renderer.setAttribute(this.element.nativeElement, "autocomplete", "off");

		// Subscribe to changes in the selected suggestion.
		this.resultElementList?.changes.pipe( takeUntil(this._unsubscribe) ).subscribe(this.scrollIntoView.bind(this));
	}

	/**
	* Scroll the selected suggestion into view
	*
	* @param {ElementRef[]} activeList List of elements that represent the currently selected suggestion. Should only ever be one item in the list.
	*/
	private scrollIntoView(activeList: ElementRef[]): void {
		const activeButtons = activeList.map( (item: ElementRef) => item?.nativeElement ).filter( x => !!x );

		if (activeButtons.length) {
			const button = activeButtons.pop();
			button.scrollIntoView({"block": "nearest", "behavior": "smooth"});
		}
	}

	@HostListener('window:click', ['$event'])
	windowClick(event: MouseEvent): void {

		const els = new WeakSet<HTMLElement>();
		let element: HTMLElement|null = event.target as HTMLElement;

		if (!!document.activeElement) {
			// Add the current active element. Required because Chrome registers the target of
			// a click event on an input field as the input field's parent element (go figure!).
			els.add(document.activeElement as HTMLElement);
		}

		if (!!element) {
			do {
				els.add(element);
				if (element === this.element.nativeElement.parent) {
					element = null;
				}
			} while (element = element?.parentElement ?? null);
		}

		// Hide the suggestions if we click the mouse outside of the input element or the results section
		// const resultsSectionElement = this.resultsSection?.elementRef?.nativeElement;
		// if (!els.has(this.element.nativeElement) && (!!resultsSectionElement && !els.has(resultsSectionElement))) {
		if (!els.has(this.element.nativeElement)) {
			this.hideSuggestions();
		}
	}

	@HostListener('keydown', ['$event'])
	handleEsc(event: KeyboardEvent) {
		if (TypeAhead.isEscapeKey(event)) {

			// Hide the list of suggestions when the escape key is pressed
			this.hideSuggestions();
			event.preventDefault();
			return;
		}
		else if (TypeAhead.isTabKey(event) && this._showSuggestions) {

			if (this.results.length > 0) {
				if (this.suggestionIndex !== TypeAhead.NO_INDEX) {
					this.handleSelectSuggestion(this.results[this.suggestionIndex]);
					this.hideSuggestions();
				}
				else {
					// Disable the Tab key if the list of suggestions is visible (prevents undesirable behaviour and focus of wrong UI elements)
					event.preventDefault();
				}
			}
			else {
				// If there are no results, hide the "no results" dropdown and use the default Tab key behaviour
				this.hideSuggestions();
				return;
			}
		}
		this.keydown$.next(event);
	}


	@HostListener('keyup', ['$event'])
	onkeyup(event: KeyboardEvent) {
		event.preventDefault();
		this.keyup$.next(event);
	}

	private renderTemplate() {
		this.viewContainer.createEmbeddedView(this.suggestionsTemplate);
		this.cdr.markForCheck();
	}

	private distinctComparison( a: any, b: any ): boolean {
		if (this._forceRefresh) {
			return false;
		}
		else {
			return a === b;
		}
	}

	private hideSuggestionsWhenEmpty(query: string) {
		if (!this.taAllowEmpty && query === "") {
			this.hideSuggestions();
		}
	}

	private listenAndSuggest(obs: Subject<KeyboardEvent>) {
		obs
			.pipe(
				filter((e: KeyboardEvent) => TypeAhead.validateNonCharKeyCode(e.keyCode)),
				tap( (e: KeyboardEvent) => { this._forceRefresh = e.keyCode === 0; } ),
				// tap( e => console.log(e.key) ),
				map(TypeAhead.toFormControlValue),
				tap( this.hideSuggestionsWhenEmpty.bind(this) ),
				debounceTime(this.taDebounce),
				concatWith(),
				distinctUntilChanged( this.distinctComparison.bind(this) ),
				// tap(query => {
				// 	console.log(this.taAllowEmpty, this.taMinSearchLength, query.length);
				// }),
				filter((query: string) => this.taAllowEmpty || (TypeAhead.hasCharacters(query) && query.length >= this.taMinSearchLength)),
				tap((query: string) => { this.searchQuery = query; }),
				switchMap( this.suggest.bind(this) )
			)
			.subscribe((results: string[] | any) => {
				this.assignResults(results);
				if (!this._forceRefresh && document.activeElement === this.nativeElement) {
					this.displaySuggestions();
				}
				this._forceRefresh = false;
			});
	}

	suggest(query: string): Observable<string[]> {
		// If the search service is not empty, query that. Otherwise, use the provided list (even if it's empty)
		return hasValue(this.taSearchService) ? this.request(query) : this.createListSource(this.taList, query);
	}

	public get currentValue(): string {
		return this.nativeElement.value;
	};

	private request(query: string): Observable<string[]> {
		this.element.nativeElement.parentNode.classList.add("is-loading");
		return from(this.taSearchService!(query, this.taCaseSensitive)) as Observable<string[]>;
	}

	private filterEnterEvent(elementObs: Subject<KeyboardEvent>) {
		elementObs.pipe(filter(TypeAhead.isEnterKey)).subscribe((event: KeyboardEvent) => {
			event.stopPropagation();
			event.preventDefault();
			this.handleSelectSuggestion(this.activeResult);
		});
	}

	private assignResults(results: any[]) {
		const labelForDisplay = this.taListItemLabel;
		this.resultsAsItems = results;
		this._results = results.map(
			(item: string | any) => (labelForDisplay ? item[labelForDisplay] : item)
		);
		// this.suggestionIndex = TypeAhead.NO_INDEX;
		if (this.suggestionIndex > results.length) {
			this.suggestionIndex = results.length - 1;
		}
		if (!results || !results.length) {
			this.activeResult = this.searchQuery;
		}
	}

	private navigateWithArrows(elementObs: Subject<KeyboardEvent>) {
		elementObs
			.pipe(
				filter((e: any) => TypeAhead.validateArrowKeys(e.keyCode)),
				map((e: any) => e.keyCode)
			)
			.subscribe((keyCode: number) => {
				this.updateIndex(keyCode);
				this.displaySuggestions();
			});
	}

	public hideSuggestions() {
		this._showSuggestions = false;
	}

	private displaySuggestions() {
		this.element.nativeElement.parentNode.classList.remove("is-loading");
		this._showSuggestions = !this.element.nativeElement.readOnly;
		if (this._showSuggestions && (this.taHideNoResults && this._results.length === 0)) {
			this._showSuggestions = false;
		}
		this.cdr.markForCheck();
	}

	private scrollSelectedResultIntoView() {
		const resultsSection = this.resultsSection.nativeElement;
		const selectedItem = resultsSection.children.item(this.suggestionIndex + 1); // ⟵ Add 1 because the first chidl is the backdrop
		if (!selectedItem) {
			return;
		}

		const parentRect = resultsSection.getBoundingClientRect();
		const itemRect = selectedItem.getBoundingClientRect();
		if (itemRect.bottom > parentRect.bottom) {
			resultsSection.scrollBy({
				"top": itemRect.bottom - parentRect.bottom,
				"left": 0,
				"behavior": "smooth"
			});
		}
		else if (itemRect.top < parentRect.top) {
			resultsSection.scrollBy({
				"top": itemRect.top - parentRect.top,
				"left": 0,
				"behavior": "smooth"
			});
		}
	}

	updateIndex(keyCode: number) {
		this.suggestionIndex = TypeAhead.resolveNextIndex(this.suggestionIndex, keyCode === Key.ArrowDown, this.results.length );
		this.scrollSelectedResultIntoView();
	}

	public get showSuggestions(): boolean {
		return this._showSuggestions;
	}

	private handleSelectSuggestion(suggestion: string) {
		const result = this.resultsAsItems.length ? this.resultsAsItems[this.suggestionIndex] : suggestion;
		if (this.resultsAsItems.length) {
			if (Unselectable.isUnselectable(result)) {
				console.log("Unselectable");
				return;
			}
		}

		this.hideSuggestions();
		const resolvedResult = this.suggestionIndex === TypeAhead.NO_INDEX ? this.searchQuery : result;
		this.taSelected.emit(resolvedResult);
	}

	public handleSelectionClick(suggestion: string, index: number) {
		this.suggestionIndex = index;
		this.handleSelectSuggestion(suggestion);
	}

	private createListSource(list: any[], query: string): Observable<string[]> {
		const sanitizedQuery = this.taCaseSensitive ? query : query.toLowerCase();
		const fieldsToExtract = this.taListItemField;

		// Find all items that match at the start of the string
		const startsWithList = list.filter((item: string | any) => {
			const itemValues = TypeAhead.resolveItemValue(item, fieldsToExtract, this.taCaseSensitive );
			return itemValues.some(v => v.startsWith(sanitizedQuery));
		});

		if (this.onlyMatchStart) {
			return of(startsWithList);
		}

		// Find all items that match (but not at the start of the string)
		const includesList = list.filter((item: string | any) => {
			const values = TypeAhead.resolveItemValue(item, fieldsToExtract, this.taCaseSensitive );
			return values.some(v => v.includes(sanitizedQuery)) && !values.some(v => v.startsWith(sanitizedQuery));
		});

		// Return an observable of the items that match, with the ones matching at the start of the string at the top of the list
		return of(startsWithList.concat(includesList));
	}

	markIsActive(index: number, result: string): boolean {
		const isActive = index === this.suggestionIndex;
		if (isActive) {
			this.activeResult = result;
		}
		return isActive;
	}

	public isUnselectable(value: any) {
		return typeof value === 'object' && Unselectable.isUnselectable(value);
	}
}

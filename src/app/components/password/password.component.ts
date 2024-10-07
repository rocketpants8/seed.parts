import { Component, Input } from "@angular/core";
import { FormControl } from "@angular/forms";

@Component({
	"selector": "password[control]",
	"templateUrl": "./password.component.html",
	"styleUrls": []
})
export class PasswordComponent {

	@Input()
	public control!: FormControl;

	@Input()
	public label: string = "Password";
	
	public showPassword: boolean = false;
}
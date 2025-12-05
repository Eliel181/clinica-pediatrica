import { AfterViewChecked, Component } from '@angular/core';
import { RouterModule, RouterOutlet } from "@angular/router";

declare const HSStaticMethods: any;

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css'
})
export class PublicLayoutComponent implements AfterViewChecked {
  ngAfterViewChecked() {
    HSStaticMethods.autoInit();
  }
}

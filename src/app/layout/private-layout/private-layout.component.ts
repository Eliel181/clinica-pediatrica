import { AfterViewChecked, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

declare const HSStaticMethods: any;
@Component({
  selector: 'app-private-layout',
  imports: [RouterModule],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.css'
})
export class PrivateLayoutComponent implements AfterViewChecked {

  ngAfterViewChecked() {
    HSStaticMethods.autoInit();
  }

}

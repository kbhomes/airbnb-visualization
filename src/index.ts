import { Application } from './application';
import { HelpView } from './util/help-view';

let app = new Application();

// Apply the HelpView to each element
for (let element of Array.from(document.querySelectorAll('[data-help-view]'))) {
    HelpView(<HTMLElement>element);
}
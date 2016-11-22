import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { Attribute } from '../data/attribute';

export class FiltersComponent extends BaseComponent {

    private view: {
        
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);
        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
    }

    public resize() {

    }

    public render() {
        let self = this;
    }
} 
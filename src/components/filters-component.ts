import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { Attribute } from '../data/attribute';
import { Listing, Neighborhood } from '../data/listing';

export class FiltersComponent extends BaseComponent {

    private view: {
        neighborhoodFiltersList?: d3.Selection<d3.BaseType, Neighborhood, d3.BaseType, {}>;
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        this.view = {};
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
        this.render();
    }

    public resize() {

    }

    public render() {
        let self = this;

        let filterSelection = d3.select(this.selector)
            .select('.filter-neighborhoods')
            .selectAll('div')
            .data(this.selection.neighborhoods || [], (d: Neighborhood) => d.name);

        let filterEnter = filterSelection
          .enter()
          .append('div')
            .text(d => d.name)
            .on('click', function(d) {
                // Send out a deselection event for this neighborhood
                self.dispatchNeighborhoodSelection(d);
            });

        let filterExit = filterSelection.exit().remove();
        this.view.neighborhoodFiltersList = filterSelection.merge(filterEnter);
    }
} 
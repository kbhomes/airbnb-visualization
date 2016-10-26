import * as d3 from './d3';

import { Dispatch, DispatchEvent, LoadEventData } from './data/dispatch';
import { NeighborhoodGeoJSON } from './data/geojson';

import * as components from './components/';

export class Application {
    private dispatcher: Dispatch;

    // Components
    private mapComponent: components.NeighborhoodMapComponent;
    private quadrantsComponent: components.PriceQuadrantsComponent;

    public constructor() {
        // Create the dispatcher
        this.dispatcher = d3.dispatch(DispatchEvent.Load, DispatchEvent.Select, DispatchEvent.Highlight, DispatchEvent.Filter);

        // Initialize components
        this.mapComponent = new components.NeighborhoodMapComponent('#map .content', this.dispatcher);
        this.quadrantsComponent = new components.PriceQuadrantsComponent('#quadrants .content', this.dispatcher);

        // Begin loading
        this.loadData();
    }

    private loadData() {
        d3.json('data/neighborhoods.geojson', (error, data: NeighborhoodGeoJSON) => {
            let loadData: LoadEventData = {
                geo: data
            };

            this.dispatcher.call(DispatchEvent.Load, undefined, loadData)
        });
    }
}
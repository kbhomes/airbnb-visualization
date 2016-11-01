import * as d3 from './d3';

import { Dispatch, DispatchEvent, LoadEventData } from './data/dispatch';
import { NeighborhoodGeoJSON } from './data/geojson';
import { Listing, Neighborhood } from './data/listing';

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
        let neighborhoods = new Map<Neighborhood.NameType, Neighborhood>();
        neighborhoods.set('South of Market', { name: 'South of Market', listings: []});

        let listings = new Map<Listing.IDType, Listing>();
        listings.set(0, null);

        d3.json('data/neighborhoods.geojson', (error, data: NeighborhoodGeoJSON) => {
            let loadData: LoadEventData = {
                geo: data,
                neighborhoods: neighborhoods,
                listings: listings
            };

            this.dispatcher.call(DispatchEvent.Load, undefined, loadData)
        });
    }
}
import * as d3 from './d3';

import { Dispatch, DispatchEvent, LoadEventData } from './data/dispatch';
import { NeighborhoodGeoJSON } from './data/geojson';
import { Listing, Neighborhood, ListingCSVRow } from './data/listing';

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
        let listings = new Map<Listing.IDType, Listing>();

        // Load the neighborhood JSON and listings JSON
        d3.json('data/neighborhoods.geojson', (error, geo: NeighborhoodGeoJSON) => {
            d3.csv(
                'data/listings.csv', 
                (row, index, columns) => row as ListingCSVRow,
                (error, data) => {
                    // Process the listing data
                    for (let row of data) {
                        // Get the neighborhood for this listing
                        let neighborhood = neighborhoods.get(row.neighbourhood_cleansed);

                        // If the neighborhood does not yet exist, create it
                        if (neighborhood === undefined) {
                            neighborhood = {
                                name: row.neighbourhood_cleansed,
                                listings: []
                            };
                            neighborhoods.set(neighborhood.name, neighborhood);
                        }

                        // Create our current listing and add it to the array and the right neighborhood
                        let listing = Listing.parseCSVRow(row, neighborhood);
                        neighborhood.listings.push(listing);
                        listings.set(listing.id, listing);
                    }

                    let loadData: LoadEventData = {
                        geo: geo,
                        neighborhoods: neighborhoods,
                        listings: listings
                    };

                    this.dispatcher.call(DispatchEvent.Load, undefined, loadData)
                }
            );
        });
    }
}
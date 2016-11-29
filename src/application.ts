import * as d3 from './d3';

import { Dispatch, DispatchEvent, LoadEventData } from './data/dispatch';
import { NeighborhoodGeoJSON } from './data/geojson';
import { Listing, Neighborhood } from './data/listing';
import { Block } from './data/block';

import * as components from './components/';

export class Application {
    private dispatcher: Dispatch;

    // Components
    private mapComponent: components.NeighborhoodMapComponent;
    private blocksComponent: components.ListingBlocksComponent;
    private quadrantsComponent: components.PriceQuadrantsComponent;
    private detailComponent: components.DetailComponent;
    private filtersComponent: components.FiltersComponent;

    public constructor() {
        // Create the dispatcher
        this.dispatcher = d3.dispatch(DispatchEvent.Load, DispatchEvent.Select, DispatchEvent.Highlight, DispatchEvent.Filter);

        // Initialize components
        // this.mapComponent = new components.NeighborhoodMapComponent('#map .content', this.dispatcher);
        // this.blocksComponent = new components.ListingBlocksComponent('#listing-blocks .content', this.dispatcher);
        this.quadrantsComponent = new components.PriceQuadrantsComponent('#quadrants .content', this.dispatcher);
        // this.detailComponent = new components.DetailComponent('#details .content', this.dispatcher);
        this.filtersComponent = new components.FiltersComponent('#filters .content', this.dispatcher);

        // Begin loading
        this.loadData();
    }

    private initializeBlocks(listings: Map<Listing.IDType, Listing>) {
        // Initialize the price block ranges
        let priceRanges = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000];
        let markupRanges = [-100, 0, 50, 100, 150, 200, 250, 300, 400, 500];

        let priceBlocks: Block[] = [];
        let markupBlocks: Block[] = [];

        for (let i = 0; i < priceRanges.length; i++) {
            priceBlocks.push({
                type: "price",
                number: i,
                minimum: priceRanges[i],
                maximum: (i === priceRanges.length - 1) ? NaN : priceRanges[i+1],
                listings: []
            });
        }

        for (let i = 0; i < markupRanges.length; i++) {
            markupBlocks.push({
                type: "markup",
                number: i,
                minimum: markupRanges[i],
                maximum: (i === markupRanges.length - 1) ? NaN : markupRanges[i+1],
                listings: []
            });
        }

        // Initialize the blocks for the listings
        for (let listing of Array.from(listings.values())) {
            let price = listing.prices.airbnb.daily;
            let markup = listing.prices.markup_percentage;

            // Find the right price and markup block for this listing
            for (let block of priceBlocks) {
                if (Block.contains(block, listing)) {
                    block.listings.push(listing);
                    listing.priceBlock = block;
                    continue;
                }
            }

            for (let block of markupBlocks) {
                if (Block.contains(block, listing)) {
                    block.listings.push(listing);
                    listing.markupBlock = block;
                    continue;
                }
            }
        }

        // Update the price and markup blocks with information about where they start relative to one another
        priceBlocks.reduce((accumulator, block) => {
            block.listingsStartIndex = accumulator;
            return accumulator + block.listings.length;
        }, 0);

        markupBlocks.reduce((accumulator, block) => {
            block.listingsStartIndex = accumulator;
            return accumulator + block.listings.length;
        }, 0);

        // Sort the listings within each block
        for (let block of priceBlocks) {
            block.listings.sort((a,b) => a.prices.airbnb.daily - b.prices.airbnb.daily);
        }

        for (let block of markupBlocks) {
            block.listings.sort((a,b) => a.prices.markup_percentage - b.prices.markup_percentage);
        }

        return [priceBlocks, markupBlocks];
    }

    private loadData() {
        let neighborhoods = new Map<Neighborhood.NameType, Neighborhood>();
        let listings = new Map<Listing.IDType, Listing>();

        // Load the neighborhood JSON and listings JSON
        d3.json('data/neighborhoods.geojson', (error, geo: NeighborhoodGeoJSON) => {
            d3.csv(
                'data/listings.csv', 
                (error, data) => {
                    // Process the listing data
                    for (let row of data) {
                        // Get the neighborhood for this listing
                        let neighborhood = neighborhoods.get(row['neighbourhood_cleansed']);

                        // If the neighborhood does not yet exist, create it
                        if (neighborhood === undefined) {
                            neighborhood = {
                                name: row['neighbourhood_cleansed'],
                                listings: []
                            };
                            neighborhoods.set(neighborhood.name, neighborhood);
                        }

                        // Create our current listing and add it to the array and the right neighborhood
                        let listing = Listing.parseCSVRow(row, neighborhood);
                        neighborhood.listings.push(listing);
                        listings.set(listing.id, listing);
                    }

                    // Process the blocks
                    let [priceBlocks, markupBlocks] = this.initializeBlocks(listings);

                    let loadData: LoadEventData = {
                        geo: geo,
                        neighborhoods: neighborhoods,
                        listings: listings,
                        priceBlocks: priceBlocks,
                        markupBlocks: markupBlocks
                    };

                    this.dispatcher.call(DispatchEvent.Load, undefined, loadData)
                }
            );
        });
    }
}
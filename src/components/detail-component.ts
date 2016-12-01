import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { NeighborhoodGeoJSON, NeighborhoodGeoJSONFeature } from '../data/geojson';
import { Listing, Neighborhood } from '../data/listing';
import { Block } from '../data/block';
import { Attribute } from '../data/attribute';

export class DetailComponent extends BaseComponent {

    private view: {
        moneyFormat?: (n:number) => string;

        listingCountDetail?: d3.DatalessSelection;
        medianPriceDetail?: d3.DatalessSelection;
        medianRatingDetail?: d3.DatalessSelection;
    }

    private listings: Listing[];

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        this.view = {};
        this.view.moneyFormat = d3.format('$.2f');
        this.view.listingCountDetail = d3.select(this.element).select('#detail-listing-count .detail-value');
        this.view.medianPriceDetail = d3.select(this.element).select('#detail-median-price .detail-value');
        this.view.medianRatingDetail = d3.select(this.element).select('#detail-median-rating .detail-value');
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);

        // Create the flat array copy of all the listings
        this.listings = Array.from(this.data.listings.values());

        // Render the default details 
        this.renderAllDetails();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);

        if (this.selection.neighborhoods && this.selection.neighborhoods.length) {
            this.renderNeighborhoodDetails(this.selection.neighborhoods);
        }
        else if (this.selection.listings && this.selection.listings.length) {
            this.renderListingDetails(this.selection.listings);
        }
        else if (this.selection.priceBlocks && this.selection.priceBlocks.length) {
            this.renderBlockDetails(this.selection.priceBlocks);
        }
        else if (this.selection.markupBlocks && this.selection.markupBlocks.length) {
            this.renderBlockDetails(this.selection.markupBlocks);
        }
        else {
            // Nothing was selected, so render the default details
            this.renderAllDetails();
        }
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
    }

    private renderAllDetails() {
        // Render details for all our listings
        this.renderListingDetails(this.listings);
    }

    private renderNeighborhoodDetails(neighborhoods: Neighborhood[]) {
        // Merge all the listings together from these neighborhoods
        let listings = neighborhoods.reduce((all: Listing[], n: Neighborhood) => all.concat(n.listings), []);

        // Render details for the listings from these neighborhoods
        this.renderListingDetails(listings);
    }

    private renderBlockDetails(blocks: Block[]) {
        // Merge all the listings together from these blocks
        let listings = blocks.reduce((all: Listing[], b: Block) => all.concat(b.listings), []);

        // Render details for the listings from these blocks
        this.renderListingDetails(listings);
    }

    private renderListingDetails(listings: Listing[]) {
        // The number of listings is the count of all combined listings
        this.view.listingCountDetail.text(
            listings.length
        );

        // The median price of all listings
        this.view.medianPriceDetail.text(
            this.view.moneyFormat(
                d3.median(listings, l => Attribute.price.accessor(l))
            )
        );

        // The median rating of all listings that do have valid rating scores
        this.view.medianRatingDetail.text(
            d3.median(
                listings.filter(l => !isNaN(l.reviews.rating)), 
                l => Attribute.rating.accessor(l)
            )
        );
    }

    public resize() {

    }

    public render() {
        let self = this;
    }
} 
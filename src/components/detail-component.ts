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

        amenitiesColorScale?: d3.ScaleSequential<string>;
        amenitiesSVG?: d3.DatalessSelection;
        amenitiesGrid?: d3.DataSelection<[string, number]>;
        amenitiesHoverDetails?: d3.DatalessSelection;
    }

    private listings: Listing[];
    private amenitiesMap: Map<string, number>;

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        this.view = {};
        this.view.moneyFormat = d3.format('$.2f');
        this.view.listingCountDetail = d3.select(this.element).select('#detail-listing-count .detail-value');
        this.view.medianPriceDetail = d3.select(this.element).select('#detail-median-price .detail-value');
        this.view.medianRatingDetail = d3.select(this.element).select('#detail-median-rating .detail-value');
        
        this.view.amenitiesColorScale = d3.scaleSequential(d3.interpolateGreens);
        this.view.amenitiesSVG = d3.select(this.element)
          .select('#detail-amenities .detail-value')
          .append('svg')
            .attr('class', 'amenities-grid')
            .attr('width', 150)
            .attr('height', 200);
        this.view.amenitiesHoverDetails = d3.select(this.element).select('#detail-amenities .detail-name .detail-name-subinfo');
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);

        // Create the flat array copy of all the listings
        this.listings = Array.from(this.data.listings.values());

        // Create the amenities map from the data set
        this.amenitiesMap = new Map<string, number>();
        for (let listing of this.listings) {
            for (let amenity of listing.amenities) {
                let count = this.amenitiesMap.get(amenity);

                // The amenity wasn't yet seen in this map
                if (count === undefined) 
                    this.amenitiesMap.set(amenity, 1);
                else
                    this.amenitiesMap.set(amenity, count + 1);
            }
        }

        // Clean up our list of amenities:
        //   - Get the list of amenities from our calculated map
        //   - Sort the amenities by count of listings that have them
        //   - Filter out the amenities that say 'translation missing' (why do these exist?)
        //   - Take the first of these 35 amenities
        let amenitiesOrdered = Array
            .from(this.amenitiesMap.entries()) 
            .sort((a, b) => b[1] - a[1])
            .filter(([amenity, count]) => amenity.indexOf('translation missing') === -1)
            .slice(0, 35);
        this.amenitiesMap = new Map(amenitiesOrdered);

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

        // Render the amenities grid
        this.renderAmenities(listings);
    }

    private renderAmenities(listings: Listing[]) {
        let self = this;

        // Reset the amenities map
        for (let amenity of Array.from(this.amenitiesMap.keys())) {
            this.amenitiesMap.set(amenity, 0);
        }

        // Count the frequency of amenities for these listings
        for (let listing of listings) {
            for (let amenity of listing.amenities) {
                // If we are tracking this amenity, update it
                if (this.amenitiesMap.has(amenity))
                    this.amenitiesMap.set(amenity, this.amenitiesMap.get(amenity) + 1);
            }
        }

        // Update the amenity color scale
        this.view.amenitiesColorScale.domain(d3.extent(Array.from(this.amenitiesMap.values())));

        // The grid will be a 5-column grid, spanning approximately 150 pixels in width
        let gridBoxSideLength = 20;
        let gridSpacing = 3;
        let gridBoxesPerRow = 5;

        let columnIndex = (i:number) => i % gridBoxesPerRow;
        let rowIndex = (i:number) => Math.floor(i / gridBoxesPerRow);

        // Select the grid of amenities
        let amenitiesSelection = this.view.amenitiesSVG
          .selectAll('rect.amenity')
            .data(Array.from(this.amenitiesMap.entries()), entry => entry[0]);

        // Draw the grid of amenities for the first time
        let amenitiesEnter = amenitiesSelection
          .enter()
          .append('rect')
            .attr('class', 'amenity')
            .attr('x', (d,i) => columnIndex(i) * (gridBoxSideLength + gridSpacing))
            .attr('y', (d,i) => rowIndex(i) * (gridBoxSideLength + gridSpacing))
            .attr('width', gridBoxSideLength)
            .attr('height', gridBoxSideLength)
            .style('stroke-width', 0)
            .style('stroke', 'black')
            .style('fill', 'white')
            .on('mouseenter', function([amenity, count]) {
                let sel = d3.select(this);

                let listingCount = +sel.attr('data-listings-count');
                let listingPercentage = (count/listingCount*100).toFixed(0);

                // Highlight this grid square
                d3.select(this).style('stroke-width', 1);

                // Show the details of this amenity
                self.view.amenitiesHoverDetails.html(`
                    ${amenity}
                    <br>
                    ${count} listings (${listingPercentage}%)
                `);
            })
            .on('mouseleave', function([amenity, count]) {
                // Unhighlight this grid square
                d3.select(this).style('stroke-width', 0);

                // Clear the amenity details
                self.view.amenitiesHoverDetails.html('');
            });

        // Update the amenities grid
        this.view.amenitiesGrid = amenitiesSelection.merge(amenitiesEnter);
        this.view.amenitiesGrid
            .attr('data-listings-count', listings.length)
            .style('fill', ([amenity, count]) => this.view.amenitiesColorScale(count));
    }

    public resize() {

    }

    public render() {
        let self = this;
    }
} 
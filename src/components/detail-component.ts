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
        medianTruliaPrice?: d3.DatalessSelection;
        listingLinkDetail?: d3.DatalessSelection;

        amenitiesColorScale?: d3.ScaleSequential<string>;
        amenitiesSVG?: d3.DatalessSelection;
        amenitiesGrid?: d3.DataSelection<[string, number]>;
        amenitiesHoverDetails?: d3.DatalessSelection;
    }

    private airbnbUrl = 'https://www.airbnb.com/rooms/';
    private amenitiesMap: Map<string, number>;

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        this.view = {};
        this.view.moneyFormat = d3.format('$.2f');
        this.view.listingCountDetail = d3.select(this.element).select('#detail-listing-count .detail-value');
        this.view.medianPriceDetail = d3.select(this.element).select('#detail-median-price .detail-value');
        this.view.medianTruliaPrice = d3.select(this.element).select('#detail-median-trulia-price .detail-value');
        this.view.listingLinkDetail = d3.select(this.element).select('#detail-listing-link');
        
        this.view.amenitiesColorScale = d3.scaleSequential(d3.interpolatePurples);
        this.view.amenitiesSVG = d3.select(this.element)
          .select('#detail-amenities .detail-value')
          .append('svg')
            .attr('class', 'amenities-grid')
            .attr('width', 150)
            .attr('height', 160);
        this.view.amenitiesHoverDetails = d3.select(this.element).select('#detail-amenities .detail-name .detail-name-subinfo');
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);

        // Create the amenities map from the data set
        this.amenitiesMap = new Map<string, number>(this.data.amenities.map((amenity):[string,number] => [amenity, 0]))

        // Render the default details 
        this.renderAllDetails();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
        this.render();
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
        this.render();
    }

    private renderAllDetails() {
        // Render details for all our listings
        this.renderListingDetails(this.filteredListings);
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

        // The truia price
        let listingTruliaPrice = listings.filter(l => !isNaN(l.prices.trulia.rent_per_bedroom));
        if (listingTruliaPrice.length > 0) {
            this.view.medianTruliaPrice.text(
                 this.view.moneyFormat(
                        d3.median(listingTruliaPrice, l => Attribute.truilaPrice.accessor(l))
                     )
                 );
        }
        else {
            this.view.medianTruliaPrice.text('N/A');
        }

        // The link to the listing if there is only one selected
        if (listings.length === 1) {
            this.view.listingLinkDetail
                .style('display', 'block')
              .select('a.detail-value')
                .attr('href', this.airbnbUrl + listings[0].id);
        }
        else {
            this.view.listingLinkDetail
                .style('display', 'none')
              .select('a.detail-value')
                .attr('href', '');
        }

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
                // Don't interact with this amenity if it's filtered out
                if (!self.isAmenityEnabled(amenity))
                    return;

                let sel = d3.select(this);

                let listingCount = +sel.attr('data-listings-count');
                let listingPercentage = (count/listingCount*100).toFixed(0);

                // Highlight this grid square
                d3.select(this).style('stroke-width', self.getAmenityStrokeWidth(amenity, true));

                // Show the details of this amenity
                self.view.amenitiesHoverDetails.html(`
                    ${amenity}
                    <br>
                    ${count} listings (${listingPercentage}%)
                `);
            })
            .on('mouseleave', function([amenity, count]) {
                // Don't interact with this amenity if it's filtered out
                if (!self.isAmenityEnabled(amenity))
                    return;

                // Unhighlight this grid square
                d3.select(this).style('stroke-width', self.getAmenityStrokeWidth(amenity, false));

                // Clear the amenity details
                self.view.amenitiesHoverDetails.html('');
            })
            .on('click', function([amenity, count]) {
                // Don't interact with this amenity if it's filtered out
                if (!self.isAmenityEnabled(amenity))
                    return;

                // Send a selection event for this amenity
                self.dispatchAmenitySelection(amenity, !d3.event.shiftKey);  
            });

        // Update the amenities grid
        this.view.amenitiesGrid = amenitiesSelection.merge(amenitiesEnter);
        this.view.amenitiesGrid
            .attr('data-listings-count', listings.length)
            .style('fill', d => this.getAmenityFill(d));
    }

    private isAmenityEnabled(amenity: string) {
        return !(this.filter.amenities.length && this.filter.amenities.indexOf(amenity) === -1);
    }

    private getAmenityFill([amenity, count]: [string, number]) {
        if (this.filter.amenities.length && this.filter.amenities.indexOf(amenity) === -1)
            return 'grey';
        else
            return this.view.amenitiesColorScale(count);
    }

    private getAmenityStrokeWidth(amenity: string, hover: boolean = false) {
        if (this.selection.amenities.indexOf(amenity) !== -1) {
            return 1;
        }
        else {
            if (hover) {
                return 1;
            }
            else {
                return 0;
            }
        }
    }

    public resize() {

    }

    public render() {
        let self = this;

        // Keep track of all the listings that are selected
        if (Dispatch.isEmptySelection(this.selection)) {
            // Nothing was selected, so render the default details
            this.renderAllDetails();
        }
        else {
            // Render all selected listings
            this.renderListingDetails(this.allSelectedListings);
        }

        // Re-color amenities
        this.view.amenitiesGrid.style('fill', d => this.getAmenityFill(d));

        // Highlight the selected amenities, if any
        this.view.amenitiesGrid.style('stroke-width', ([amenity, count]) => this.getAmenityStrokeWidth(amenity));
    }
} 
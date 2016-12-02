import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { Attribute } from '../data/attribute';
import { Listing, Neighborhood } from '../data/listing';
import { Block } from '../data/block';

export class FiltersComponent extends BaseComponent {

    private view: {
        neighborhoodFiltersList?: d3.DataSelection<Neighborhood>;
        listingsFilterList?: d3.DataSelection<Listing>;
        priceBlocksFilterList?: d3.DataSelection<Block>;
        markupBlocksFilterList?: d3.DataSelection<Block>;
        amenitiesFilterList?: d3.DataSelection<string>;
        description?: d3.DatalessSelection;
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        this.view = {};
        this.view.description = d3.select(this.element).select('.filter-description');
        this.view.description.select('.reset').on('click', () => {
            this.dispatcher.call(DispatchEvent.Select, this, {
                neighborhoods: undefined,
                listings: undefined,
                priceBlocks: undefined,
                markupBlocks: undefined
            } as SelectEventData);
        });
    }  

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
        this.render();
    }

    public resize() {

    }

    private renderNeighborhoods() {
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

    private renderListings() {
        let self = this;
        
        let filterSelection = d3.select(this.selector)
            .select('.filter-listings')
            .selectAll('div')
            .data(this.selection.listings || [], (d: Listing) => d.id + '');

        let filterEnter = filterSelection
          .enter()
          .append('div')
            .text(d => d.name)
            .on('click', function(d) {
                // Send out a deselection event for this listing
                self.dispatchListingSelection(d);
            });

        let filterExit = filterSelection.exit().remove();
        this.view.listingsFilterList = filterSelection.merge(filterEnter);
    }

    private renderPriceBlocks() {
        let self = this;
        
        let filterSelection = d3.select(this.selector)
            .select('.filter-price-blocks')
            .selectAll('div')
            .data(this.selection.priceBlocks || [], (d: Block) => d.number + '');

        let filterEnter = filterSelection
          .enter()
          .append('div')
            .text(d => {
                let label = '$' + d.minimum.toFixed(0);

                if (isNaN(d.maximum)) {
                    label += '+';
                } 
                else {
                    label += ' - $' + d.maximum.toFixed(0);
                }

                return label;
            })
            .on('click', function(d) {
                // Send out a deselection event for this price block
                self.dispatchBlockSelection(d);
            });

        let filterExit = filterSelection.exit().remove();
        this.view.priceBlocksFilterList = filterSelection.merge(filterEnter);
    }

    private renderMarkupBlocks() {
        let self = this;
        
        let filterSelection = d3.select(this.selector)
            .select('.filter-markup-blocks')
            .selectAll('div')
            .data(this.selection.markupBlocks || [], (d: Block) => d.number + '');

        let filterEnter = filterSelection
          .enter()
          .append('div')
            .text(d => {
                let label = d.minimum.toFixed(0);

                if (isNaN(d.maximum)) {
                    label += '+%';
                } 
                else {
                    label += '% - ' + d.maximum.toFixed(0) + '%';
                }

                return label;
            })
            .on('click', function(d) {
                // Send out a deselection event for this markup block
                self.dispatchBlockSelection(d);
            });

        let filterExit = filterSelection.exit().remove();
        this.view.markupBlocksFilterList = filterSelection.merge(filterEnter);
    }

    private renderAmenities() {
        let self = this;
        
        let filterSelection = d3.select(this.selector)
            .select('.filter-amenities')
            .selectAll('div')
            .data(this.selection.amenities || []);

        let filterEnter = filterSelection
          .enter()
          .append('div')
            .text(d => d)
            .on('click', function(d) {
                // Send out a deselection event for this amenity
                self.dispatchAmenitySelection(d);
            });

        let filterExit = filterSelection.exit().remove();
        this.view.amenitiesFilterList = filterSelection.merge(filterEnter);
    }

    private renderFilterDescription() {
        let pluralize = (count: number, word: string) => {
            let label = count + ' ';
            
            if (count === 1) {
                label += word;
            }
            else {
                if (word.charAt(word.length - 1) == 'y') {
                    label += word.slice(0, word.length - 1) + 'ies';
                }
                else {
                    label += word + 's';
                }
            }

            return label;
        };

        if (this.selection.neighborhoods && this.selection.neighborhoods.length) {
            this.view.description
                .style('display', 'block')
              .select('.count')
                .text(pluralize(this.selection.neighborhoods.length, 'neighborhood'));
        }
        else if (this.selection.listings && this.selection.listings.length) {
            this.view.description
                .style('display', 'block')
              .select('.count')
                .text(pluralize(this.selection.listings.length, 'listing'));
        }
        else if (this.selection.priceBlocks && this.selection.priceBlocks.length) {
            this.view.description
                .style('display', 'block')
              .select('.count')
                .text(pluralize(this.selection.priceBlocks.length, 'price block'));
        }
        else if (this.selection.markupBlocks && this.selection.markupBlocks.length) {
            this.view.description
                .style('display', 'block')
              .select('.count')
                .text(pluralize(this.selection.markupBlocks.length, 'markup block'));
        }
        else if (this.selection.amenities && this.selection.amenities.length) {
            this.view.description
                .style('display', 'block')
              .select('.count')
                .text(pluralize(this.selection.amenities.length, 'amenity'));
        }
        else {
            this.view.description.style('display', 'none');
        }
    }

    public render() {
        let self = this;

        this.renderNeighborhoods();
        this.renderListings();
        this.renderPriceBlocks();
        this.renderMarkupBlocks();
        this.renderAmenities();
        this.renderFilterDescription();
    }
} 
import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { Attribute } from '../data/attribute';
import { Listing, Neighborhood } from '../data/listing';
import { Block } from '../data/block';

export class FiltersComponent extends BaseComponent {

    private view: {
        neighborhoodFilterList?: d3.DataSelection<Neighborhood>;
        priceBlocksFilterList?: d3.DataSelection<Block>;
        markupBlocksFilterList?: d3.DataSelection<Block>;
        amenitiesFilterList?: d3.DataSelection<string>;

        links?: d3.DatalessSelection;
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        this.view = {};
        this.view.links = d3.select(this.element.parentElement).select('.filter-links');
        this.view.links
            .select('a.reset')
            .on('click', () => {
                this.dispatcher.call(DispatchEvent.Filter, this, Dispatch.emptyFilter());
            });
    }  

    public onLoad(data: LoadEventData) {
        super.onLoad(data);
        this.render();
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);

        // Update the filter lists with the chosen filter
        this.view.neighborhoodFilterList.property('selected', d => filter.neighborhoods.indexOf(d) !== -1);
        this.view.priceBlocksFilterList.property('selected', d => filter.priceBlocks.indexOf(d) !== -1);
        this.view.markupBlocksFilterList.property('selected', d => filter.markupBlocks.indexOf(d) !== -1);
        this.view.amenitiesFilterList.property('selected', d => filter.amenities.indexOf(d) !== -1);

        // Update the reset link
        this.renderFilterLinks();
    }

    public resize() {

    }

    private renderNeighborhoods() {
        let self = this;

        let filterSelect = d3.select(this.selector).select('.filter-neighborhoods')
        

        let neighborhoods = Array.from(this.data.neighborhoods.values()).sort(function(a,b){
            if(a.name < b.name) return -1;
            if(a.name > b.name) return 1;
            return 0;
        })
        
        let filterOptions = filterSelect
          .selectAll('option.choice')
            .data(neighborhoods, (d: Neighborhood) => d.name);

        let filterOptionsEnter = filterOptions
          .enter()
          .append('option')
            .attr('class', 'choice')
            .text(d => d.name);

        this.view.neighborhoodFilterList = filterOptions.merge(filterOptionsEnter);

        filterSelect.on('change', () => {
            let selectedNeighborhoods = this.view.neighborhoodFilterList
                .filter(function(d) { return this['selected']; })
                .data();
            
            this.dispatcher.call(DispatchEvent.Select, this, Dispatch.emptySelection());
            this.dispatchNeighborhoodFilter(selectedNeighborhoods);
        });
    }

    private renderPriceBlocks() {
        let self = this;
        
        let filterSelect = d3.select(this.selector).select('.filter-price-blocks');

        let filterOptions = filterSelect
          .selectAll('option.choice')
            .data(this.data.priceBlocks, (d: Block) => d.number + '');

        let filterOptionsEnter = filterOptions
          .enter()
          .append('option')
            .attr('class', 'choice')
            .text(d => {
                let label = '$' + d.minimum.toFixed(0);

                if (isNaN(d.maximum)) {
                    label += '+';
                } 
                else {
                    label += ' - $' + d.maximum.toFixed(0);
                }

                return label;
            });

        this.view.priceBlocksFilterList = filterOptions.merge(filterOptionsEnter);

        filterSelect.on('change', () => {
            let selectedPriceBlocks = this.view.priceBlocksFilterList
                .filter(function(d) { return this['selected']; })
                .data();

            this.dispatcher.call(DispatchEvent.Select, this, Dispatch.emptySelection());
            this.dispatchPriceBlockFilter(selectedPriceBlocks);
        });
    }

    private renderMarkupBlocks() {
        let self = this;
        
        let filterSelect = d3.select(this.selector).select('.filter-markup-blocks');

        let filterOptions = filterSelect
          .selectAll('option.choice')
            .data(this.data.markupBlocks, (d: Block) => d.number + '');

        let filterOptionsEnter = filterOptions
          .enter()
          .append('option')
            .attr('class', 'choice')
            .text(d => {
                let label = d.minimum.toFixed(0);

                if (isNaN(d.maximum)) {
                    label += '+%';
                } 
                else {
                    label += '% - ' + d.maximum.toFixed(0) + '%';
                }

                return label;
            });

        this.view.markupBlocksFilterList = filterOptions.merge(filterOptionsEnter);

        filterSelect.on('change', () => {
            let selectedMarkupBlocks = this.view.markupBlocksFilterList
                .filter(function(d) { return this['selected']; })
                .data();

            this.dispatcher.call(DispatchEvent.Select, this, Dispatch.emptySelection());
            this.dispatchMarkupBlockFilter(selectedMarkupBlocks);
        });
    }

    private renderAmenities() {
        let self = this;
        
        let filterSelect = d3.select(this.selector).select('.filter-amenities');
            
        let filterOptions = filterSelect
          .selectAll('option.choice')
            .data(this.data.amenities, (amenity: string) => amenity);

        let filterOptionsEnter = filterOptions
          .enter()
          .append('option')
            .attr('class', 'choice')
            .text(d => d);

        this.view.amenitiesFilterList = filterOptions.merge(filterOptionsEnter);

        filterSelect.on('change', () => {
            let selectedAmenities = this.view.amenitiesFilterList
                .filter(function(d) { return this['selected']; })
                .data();

            this.dispatcher.call(DispatchEvent.Select, this, Dispatch.emptySelection());
            this.dispatchAmenityFilter(selectedAmenities);
        });
    }

    public renderFilterLinks() {
        if (Dispatch.isEmptyFilter(this.filter)) {
            this.view.links.style('display', 'none');
        }
        else {
            this.view.links.style('display', 'inline-block');
        }
    }

    public render() {
        let self = this;

        this.renderNeighborhoods();
        this.renderPriceBlocks();
        this.renderMarkupBlocks();
        this.renderAmenities();
        this.renderFilterLinks();
    }
} 
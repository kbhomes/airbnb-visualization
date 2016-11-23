import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { Listing, Neighborhood } from '../data/listing';

export class ListingBarsComponent extends BaseComponent {
    
    private view: {
        svg?: d3.Selection<d3.BaseType, {}, d3.BaseType, {}>;
        bars?: d3.Selection<d3.BaseType, Listing, d3.BaseType, {}>;
    }

    private sortedListings: Listing[];

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        // Initialize our canvas
        let width = this.element.clientWidth;
        let height = this.element.clientHeight;

        this.view = {};
        this.view.svg = d3.select(this.selector).append('svg')
            .attr('class', 'chart')
            .attr('width', width)
            .attr('height', height);
    }

    private sortList(property: 'price'|'markup', list: Listing[] = this.sortedListings) {
        this.sortedListings = list.sort((a, b) => {
            let comparison = 0;

            if (property === 'price')
                comparison = b.prices.airbnb.daily - a.prices.airbnb.daily;
            else
                comparison = b.prices.markup_percentage - a.prices.markup_percentage;

            if (comparison === 0) 
                return b.id - a.id;
            else
                return comparison;
        });
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);
        
        // Sort the listings by price
        this.sortList('price', Array.from(this.data.listings.values()));
        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);

        this.view.bars.selectAll('rect').attr('fill', (d: Listing) => {
            // Highlight this listing if it belongs to the highlighted neighborhood
            if (this.highlight.neighborhood === d.neighborhood)
                return 'red';
            else
                return 'steelblue';
        });
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
        this.render();
    }

    public resize() {

    }

    public render() {
        let self = this;

        let padding = 1;
        let width = this.element.clientWidth;
        let height = Math.floor(this.element.clientHeight / 2 - 2*padding);
        let barWidth = 5; //width / this.data.listings.size;
        let listingBarWidth = 3;

        // Create the y-axis's scale
        let priceY = d3.scaleLog()
            .range([0, height])
            .domain(d3.extent(this.sortedListings, l => l.prices.airbnb.daily));

        let markupMax = d3.max(this.sortedListings, l => l.prices.markup_percentage);

        // Create our data join
        let barSelection = this.view.svg.selectAll('g').data(this.sortedListings, l => l['id']);

        // Create the bars for the entering elements
        let barEnter = barSelection.enter().append('g');

        barEnter.append('rect')
            .attr('class', 'bar-price')
            .attr('fill', 'steelblue')
            .attr('y', d => height - priceY(d.prices.airbnb.daily))
            .attr('x', barWidth)
            .attr('height', d => priceY(d.prices.airbnb.daily))
            .attr('width', listingBarWidth);

        barEnter.append('rect')
            .attr('class', 'bar-markup')
            .attr('fill', 'steelblue')
            .attr('y', d => height + 2*padding + height/2 - Math.max(0, (height/2)*d.prices.markup_percentage/markupMax))
            .attr('height', d => Math.abs((height/2)*d.prices.markup_percentage/markupMax))
            .attr('width', barWidth);

        barEnter.on('mouseenter', function(d) {
                // Dispatch a highlight event for this neighborhood
                self.dispatcher.call(DispatchEvent.Highlight, this, {
                    neighborhood: undefined,
                    listing: d
                } as HighlightEventData);

                d3.select(this)
                    .selectAll('rect')
                    .attr('fill', 'red');
            })
            .on('mouseleave', function() {
                // Dispatch an empty highlight event
                self.dispatcher.call(DispatchEvent.Highlight, this, {
                    neighborhood: undefined,
                    listing: undefined
                } as HighlightEventData);

                d3.select(this)
                    .selectAll('rect')
                    .attr('fill', 'steelblue');
            });

        
        barEnter.selectAll('rect').on('click', function(d) {
            let className = d3.select(this).attr('class');

            // Sort by the clicked measure and re-render
            self.sortList(className === 'bar-price' ? 'price' : 'markup');
            self.render();
        });

        // Draw the axes
        this.view.svg.append('line')
            .attr('id', 'bar-axis-prices')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', height)
            .attr('y2', height)
            .attr('stroke-width', 1)
            .attr('stroke', 'black');

        this.view.svg.append('line')
            .attr('id', 'bar-axis-markup')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', height + 2*padding + height/2)
            .attr('y2', height + 2*padding + height/2)
            .attr('stroke-width', 1)
            .attr('stroke', 'black');

        // Update all the bars
        this.view.bars = barEnter.merge(barSelection);

        this.view.bars
            .transition()
            .delay((d, i) => i * (500 / this.sortedListings.length))
            .attr('transform', (d, i) => `translate(${i * barWidth}, 0)`);
    }
} 
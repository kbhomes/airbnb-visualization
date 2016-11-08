import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { Listing, Neighborhood } from '../data/listing';

export class PriceQuadrantsComponent extends BaseComponent {
    
    private listings: Listing[];
    private neighborhoods: Neighborhood[];

    private view: {
        svg?: d3.Selection<d3.BaseType, {}, d3.BaseType, {}>;
        padding?: d3.Padding;
        
        neighborhoodCircles?: d3.Selection<d3.BaseType, Neighborhood, d3.BaseType, {}>;
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        // Initialize our canvas
        let width = this.element.clientWidth;
        let height = this.element.clientHeight;

        this.view = {};
        this.view.padding = new d3.Padding(40);
        this.view.svg = d3.select(this.selector).append('svg')
            .attr('class', 'chart')
            .attr('width', width)
            .attr('height', height);
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);

        this.listings = Array.from(this.data.listings.values());
        this.neighborhoods = Array.from(this.data.neighborhoods.values());

        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);

        this.view.neighborhoodCircles.attr('fill', d => {
            if (highlight.neighborhood === d) 
                return 'rgba(255, 100, 100, 0.5)';
            else
                return 'rgba(50, 50, 100, 0.5)';
        });
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
    }

    public resize() {

    }

    public render() {
        let self = this;

        let width = this.element.clientWidth;
        let height = this.element.clientHeight;

        // Create the padding for the scatter plot itself
        let innerPadding = d3.Padding.add(this.view.padding, new d3.Padding(0, 40, 40, 0));

        let markupScale = d3.scaleLinear()
            .domain(d3.extent(this.neighborhoods, n => d3.mean(n.listings, l => l.prices.markup_percentage)))
            .range([innerPadding.height(height) + innerPadding.top, innerPadding.top]);

        let otherScale = d3.scaleLinear()
            .domain(d3.extent(this.neighborhoods, n => d3.mean(n.listings, l => l.reviews.rating)))
            .range([innerPadding.left, innerPadding.left + innerPadding.width(width)]);

        let countScale = d3.scaleLinear()
            .domain(d3.extent(this.neighborhoods, n => n.listings.length))
            .range([5, 30]);

        let markupAxis = d3.axisLeft(markupScale);
        let otherAxis = d3.axisBottom(otherScale);

        // Draw the axes
        this.view.svg
          .append('g')
            .attr('class', 'markup-axis')
            .style('transform', innerPadding.translateX(0))
            .call(markupAxis);

        this.view.svg
          .append('g')
            .attr('class', 'other-axis')
            .style('transform', innerPadding.translateY(innerPadding.height(height)))
            .call(otherAxis);

        // Draw axis labels
        this.view.svg
          .append('g')
            .attr('class', 'axis-label')
            .style('transform', `translate(${this.view.padding.left}px, ${innerPadding.centerY(height)}px)`)
          .append('text')
            .text('Markup')
            .style('transform', 'rotate(-90deg)');
        
        this.view.svg
          .append('g')
            .attr('class', 'axis-label')
            .style('transform', `translate(${innerPadding.centerX(width)}px, ${height - this.view.padding.bottom}px)`)
          .append('text')
            .text('Rating');

        // Draw the neighborhoods
        this.view.neighborhoodCircles = this.view.svg
          .selectAll('circle')
            .data(this.neighborhoods)
          .enter()
          .append('circle')
            .attr('cx', d => otherScale(d3.mean(d.listings, l => l.reviews.rating)))
            .attr('cy', d => markupScale(d3.mean(d.listings, l => l.prices.markup_percentage)))
            .attr('r', d => countScale(d.listings.length))
            .attr('fill', 'rgba(50, 50, 100, 0.5)')
            .on('mouseenter', function(d) {
                // Dispatch a highlight event for this neighborhood
                self.dispatcher.call(DispatchEvent.Highlight, this, {
                    neighborhood: d,
                    listing: undefined
                } as HighlightEventData);

                // Scale up the particular neighborhood. 
                let sel = d3.select(this);
                sel.moveToFront();
                sel.style('fill', 'rgba(255, 100, 100, 0.5)');
            })
            .on('mouseleave', function(d) {
                // Dispatch an empty highlight event
                self.dispatcher.call(DispatchEvent.Highlight, this, {
                    neighborhood: undefined,
                    listing: undefined
                } as HighlightEventData);

                let sel = d3.select(this);
                sel.style('fill', 'rgba(50, 50, 100, 0.5)');
            });
    }
} 
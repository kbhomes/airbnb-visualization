import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { Listing, Neighborhood } from '../data/listing';

export class PriceQuadrantsComponent extends BaseComponent {
    
    private view: {
        svg?: d3.Selection<d3.BaseType, {}, d3.BaseType, {}>;
        padding?: d3.Padding;
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
        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);
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
            .domain([0, 100])
            .range([innerPadding.height(height), 0]);

        let otherScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, innerPadding.width(width)]);

        let markupAxis = d3.axisLeft(markupScale);
        let otherAxis = d3.axisBottom(otherScale);

        // Draw the axes
        this.view.svg
          .append('g')
            .attr('class', 'markup-axis')
            .style('transform', innerPadding.translate(0, 0))
            .call(markupAxis);

        this.view.svg
          .append('g')
            .attr('class', 'other-axis')
            .style('transform', innerPadding.translate(0, innerPadding.height(height)))
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
    }
} 
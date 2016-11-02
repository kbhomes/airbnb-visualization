import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { Listing, Neighborhood } from '../data/listing';

export class PriceQuadrantsComponent extends BaseComponent {
    
    private view: {
        svg?: d3.Selection<d3.BaseType, {}, d3.BaseType, {}>;
        bars?: d3.Selection<d3.BaseType, Neighborhood, d3.BaseType, {}>;
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        // Initialize our canvas
        let width = this.element.clientWidth;
        let barHeight = 20;

        this.view = {};
        this.view.svg = d3.select(this.selector).append('svg')
            .attr('class', 'chart')
            .attr('width', width);
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

        this.view.bars.select('rect')
            .attr('fill', d => {
                if (this.highlight.neighborhood === d)
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

        let width = this.element.clientWidth;
        let barHeight = 20;
        
        this.view.svg.attr('height', this.data.neighborhoods.size * barHeight);

        // Create the x-axis's scale
        let x = d3.scaleLinear()
            .range([0, width])
            .domain([0, 100]);

        // Create our data join
        let barSelection = this.view.svg.selectAll('g').data(Array.from(this.data.neighborhoods.values()));

        // Create the bars for the entering elements
        let barEnter = barSelection.enter()
          .append('g')
            .attr('transform', (d, i) => 'translate(0,' + i * barHeight + ')');

        barEnter.append('rect')
            .attr('fill', 'steelblue')
            .attr('width', d => x(d.listings.length))
            .attr('height', barHeight - 1);
            
        barEnter.append('text')
            .attr('y', barHeight / 2)
            .attr('dy', '.35em')
            .attr('x', 3)
            .text(d => d.name)

        barEnter.on('mouseenter', function(d) {
                // Dispatch a highlight event for this neighborhood
                self.dispatcher.call(DispatchEvent.Highlight, this, {
                    neighborhood: d,
                    listing: undefined
                } as HighlightEventData);

                d3.select(this)
                    .select('rect')
                    .attr('fill', 'red');
            })
            .on('mouseleave', function() {
                // Dispatch an empty highlight event
                self.dispatcher.call(DispatchEvent.Highlight, this, {
                    neighborhood: undefined,
                    listing: undefined
                } as HighlightEventData);

                d3.select(this)
                    .select('rect')
                    .attr('fill', 'steelblue');
            });

        // Update all the bars
        this.view.bars = barEnter.merge(barSelection);
    }
} 
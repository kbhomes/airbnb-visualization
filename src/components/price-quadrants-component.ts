import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { Listing, Neighborhood } from '../data/listing';
import { Attribute } from '../data/attribute';

export class PriceQuadrantsComponent extends BaseComponent {
    
    private listings: Listing[];
    private neighborhoods: Neighborhood[];

    private attributeMap: Attribute[];
    private selectedAttribute: Attribute;

    private view: {
        overlay?: d3.Selection<d3.BaseType, {}, d3.BaseType, {}>;
        svg?: d3.Selection<d3.BaseType, {}, d3.BaseType, {}>;
        padding?: d3.Padding;
        
        markupScale?: d3.ScaleLinear<number, number>;
        otherScale?: d3.ScaleLinear<number, number> | d3.ScalePoint<string>;
        countScale?: d3.ScaleLinear<number, number>;

        neighborhoodCircles?: d3.Selection<d3.BaseType, Neighborhood, d3.BaseType, {}>;
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        // Initialize our canvas
        let width = this.element.clientWidth;
        let height = this.element.clientHeight;

        this.view = {};
        this.view.padding = new d3.Padding(40);

        this.view.overlay = d3.select(this.selector).append('div')
            .attr('class', 'overlay');

        this.view.svg = d3.select(this.selector).append('svg')
            .attr('class', 'chart')
            .attr('width', width)
            .attr('height', height);
        
        this.attributeMap = [];
        this.attributeMap.push(Attribute.rating);
        this.attributeMap.push(Attribute.price);
        this.attributeMap.push(Attribute.cancellationPolicy);

        // Select the rating attribute by default
        this.selectedAttribute = this.attributeMap[0];
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);

        this.listings = Array.from(this.data.listings.values());
        this.neighborhoods = Array.from(this.data.neighborhoods.values());

        // Setup scales for usage in the render method
        this.view.markupScale = d3.scaleLinear()
            .domain(d3.extent(this.neighborhoods, Attribute.markup.neighborhoodAccessor));

        this.view.otherScale = d3.scaleLinear()
            .domain(d3.extent(this.neighborhoods, this.selectedAttribute.neighborhoodAccessor));

        this.view.countScale = d3.scaleLinear()
            .domain(d3.extent(this.neighborhoods, n => n.listings.length));

        // Create the axis elements
        this.view.svg.append('g').attr('class', 'markup-axis');
        this.view.svg.append('g').attr('class', 'other-axis');

        this.view.svg
            .append('g').attr('class', 'axis-label markup-axis-label')
            .append('text').text('Markup').style('transform', 'rotate(-90deg)');

        let attributeSelect = this.view.overlay
            .append('div').attr('class', 'axis-label other-axis-label')
            .append('select');
        
        let attributeOptionsSelection = attributeSelect.selectAll('option').data(this.attributeMap);
        let attributeOptionsEnter = attributeOptionsSelection.enter()
          .append('option')
            .text(d => d.name)
            .attr('selected', d => d === this.selectedAttribute ? true : undefined);
        let attributeOptions = attributeOptionsSelection.merge(attributeOptionsEnter);

        attributeSelect.on('change', () => {
            let index: number = attributeSelect.property('selectedIndex');
            let attribute: Attribute = attributeOptions.filter((d,i) => i == index).datum();

            this.selectedAttribute = attribute;

            // Update the scales for this attribute
            if (attribute.kind === 'continuous') {
                this.view.otherScale = d3.scaleLinear().domain(d3.extent(this.neighborhoods, attribute.neighborhoodAccessor));
            }
            else if (attribute.kind === 'ordinal') {
                this.view.otherScale = d3.scalePoint().domain(attribute.ordinalDomain);
            }

            this.render();
        });

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

        this.view.markupScale.range([innerPadding.height(height) + innerPadding.top, innerPadding.top]);
        this.view.countScale.range([5, 30]);

        if (this.selectedAttribute.kind === 'continuous') {
            (this.view.otherScale as d3.ScaleLinear<number, number>).range([innerPadding.left, innerPadding.left + innerPadding.width(width)]);
        }
        else {
            (this.view.otherScale as d3.ScalePoint<string>).range([innerPadding.left, innerPadding.left + innerPadding.width(width)]);
        }

        let markupAxis = d3.axisLeft(this.view.markupScale);
        let otherAxis = d3.axisBottom(this.view.otherScale);

        // Draw the axes
        this.view.svg.select('g.markup-axis')
            .style('transform', innerPadding.translateX(0))
            .call(markupAxis);

        this.view.svg.select('g.other-axis')
            .style('transform', innerPadding.translateY(innerPadding.height(height)))
            .call(otherAxis);

        // Draw axis labels
        this.view.svg.select('g.markup-axis-label')
            .style('transform', `translate(${this.view.padding.left}px, ${innerPadding.centerY(height)}px)`);
        
        this.view.overlay
          .select('div.other-axis-label')
            .style('left', `${innerPadding.centerX(width)}px`)
            .style('top', `${height - this.view.padding.bottom}px`)
            .style('transform', 'translateX(-50%)');

        // Draw the neighborhoods
        let nbhdSelection = this.view.svg
          .selectAll('circle')
            .data(this.neighborhoods);

        let nbhdEnter = nbhdSelection.enter()
          .append('circle')
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

        this.view.neighborhoodCircles = nbhdSelection.merge(nbhdEnter);
        this.view.neighborhoodCircles
            .attr('cx', d => this.view.otherScale(this.selectedAttribute.neighborhoodAccessor(d)))
            .attr('cy', d => this.view.markupScale(Attribute.markup.neighborhoodAccessor(d)))
            .attr('r', d => this.view.countScale(d.listings.length))
            .attr('fill', 'rgba(50, 50, 100, 0.5)')
    }
} 
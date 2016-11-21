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
    private selectedLevel: 'Neighborhoods' | 'Listings';

    private view: {
        overlay?: d3.Selection<d3.BaseType, {}, d3.BaseType, {}>;
        svg?: d3.Selection<d3.BaseType, {}, d3.BaseType, {}>;
        padding?: d3.Padding;
        
        markupScale?: d3.ScaleLinear<number, number>;
        otherScale?: d3.ScaleLinear<number, number> | d3.ScalePoint<string>;
        sizeScale?: d3.ScaleLinear<number, number>;

        neighborhoodCircles?: d3.Selection<d3.BaseType, Neighborhood, d3.BaseType, {}>;
        listingCircles?: d3.Selection<d3.BaseType, Listing, d3.BaseType, {}>;
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
        this.selectedLevel = 'Neighborhoods';
    }

    private updateScales() {
        if (this.selectedLevel === 'Neighborhoods') {
            let data = this.neighborhoods;

            this.view.markupScale = d3.scaleLinear().domain(d3.extent(data, Attribute.markup.neighborhoodAccessor));
            this.view.sizeScale = d3.scaleLinear().domain(d3.extent(data, Attribute.price.neighborhoodAccessor));

            if (this.selectedAttribute.kind === 'continuous') 
                this.view.otherScale = d3.scaleLinear().domain(d3.extent(data, this.selectedAttribute.neighborhoodAccessor));
        }
        else {
            let data = this.listings;

            this.view.markupScale = d3.scaleLinear().domain(d3.extent(data, Attribute.markup.accessor));
            this.view.sizeScale = d3.scaleLinear().domain(d3.extent(data, Attribute.price.accessor));

            if (this.selectedAttribute.kind === 'continuous')
                this.view.otherScale = d3.scaleLinear().domain(d3.extent(data, this.selectedAttribute.accessor));
        }

        if (this.selectedAttribute.kind === 'ordinal') {
            this.view.otherScale = 
                d3.scalePoint()
                    .domain(this.selectedAttribute.ordinalDomain)
                    .padding(1);
        }
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);

        this.listings = Array.from(this.data.listings.values());
        this.neighborhoods = Array.from(this.data.neighborhoods.values());

        // Setup scales for usage in the render method
        this.updateScales();

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

            // Update the scales for this attribute and re-render
            this.selectedAttribute = attribute;
            this.updateScales();
            this.render();
        });

        let levelSelect = this.view.overlay
          .append('div')
            .style('right', `${this.view.padding.right}px`)
          .append('select')
            .attr('class', 'level-select');
            
        let levelOptionsSelection = levelSelect.selectAll('option').data<'Neighborhoods'|'Listings'>(['Neighborhoods', 'Listings']);
        let levelOptionsEnter = levelOptionsSelection.enter()
          .append('option')
            .text(d => d);
        let levelOptions = levelOptionsSelection.merge(levelOptionsEnter);

        levelSelect.on('change', () => {
            let index: number = levelSelect.property('selectedIndex');
            let level = levelOptions.filter((d,i) => i === index).datum();

            // Update the scales for this level and re-render
            this.selectedLevel = level;
            this.updateScales();

            // Remove all the elements in the selections
            if (this.view.neighborhoodCircles)
                this.view.neighborhoodCircles.remove();

            if (this.view.listingCircles)
                this.view.listingCircles.remove();

            this.render();
        });

        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);

        if (this.selectedLevel === 'Neighborhoods') {
            this.view.neighborhoodCircles.attr('fill', d => {
                if (highlight.neighborhood === d) 
                    return 'rgba(255, 100, 100, 0.5)';
                else
                    return 'rgba(50, 50, 100, 0.5)';
            });
        }
        else {
            this.view.listingCircles.attr('fill', d => {
                if (highlight.listing === d || highlight.neighborhood === d.neighborhood) 
                    return 'rgba(255, 100, 100, 0.5)';
                else
                    return 'rgba(50, 50, 100, 0.5)';
            });
        }
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
        this.view.otherScale.range([innerPadding.left, innerPadding.left + innerPadding.width(width)]);
        this.view.sizeScale.range([5, 30]);

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

        // Draw the items
        // TODO: Remove all this dumb duplication when you're not tired
        if (this.selectedLevel === 'Neighborhoods') {
            let circleSelection = this.view.svg
            .selectAll('circle')
                .data(this.neighborhoods);

            let circleEnter = circleSelection.enter()
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

            this.view.neighborhoodCircles = circleSelection.merge(circleEnter);
            this.view.neighborhoodCircles
                .transition()
                .duration(1000)
                .attr('opacity', d => {
                    if (isNaN(this.view.otherScale(this.selectedAttribute.neighborhoodAccessor(d))))
                        return 0;
                    else
                        return 1;
                })
                .attr('cx', d => this.view.otherScale(this.selectedAttribute.neighborhoodAccessor(d)))
                .attr('cy', d => this.view.markupScale(Attribute.markup.neighborhoodAccessor(d)))
                .attr('r', d => this.view.sizeScale(Attribute.price.neighborhoodAccessor(d)))
                .attr('fill', 'rgba(50, 50, 100, 0.5)')
        }
        else if (this.selectedLevel === 'Listings') {
            let circleSelection = this.view.svg
                .selectAll('circle')
                    .data(this.listings);

            let circleEnter = circleSelection.enter()
                .append('circle')
                .on('mouseenter', function(d) {
                    // Dispatch a highlight event for this neighborhood
                    self.dispatcher.call(DispatchEvent.Highlight, this, {
                        neighborhood: undefined,
                        listing: d
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

            this.view.listingCircles = circleSelection.merge(circleEnter);
            this.view.listingCircles
                .transition()
                .duration(1000)
                .attr('opacity', d => {
                    if (isNaN(this.view.otherScale(this.selectedAttribute.accessor(d))))
                        return 0;
                    else
                        return 1;
                })
                .attr('cx', d => this.view.otherScale(this.selectedAttribute.accessor(d)))
                .attr('cy', d => this.view.markupScale(Attribute.markup.accessor(d)))
                .attr('r', d => this.view.sizeScale(Attribute.price.accessor(d)))
                .attr('fill', 'rgba(50, 50, 100, 0.5)')
        }
    }
} 
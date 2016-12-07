import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { Listing, Neighborhood } from '../data/listing';
import { Attribute } from '../data/attribute';

export class PriceQuadrantsComponent extends BaseComponent {
    
    private attributeMap: Attribute[];
    private selectedAttribute: Attribute;
    private selectedLevel: 'Neighborhoods' | 'Listings';
    private quadrantNames: [string, string, string, string];

    private view: {
        title?: d3.DatalessSelection;
        overlay?: d3.DatalessSelection;
        svg?: d3.DatalessSelection;
        padding?: d3.Padding;
        
        markupScale?: d3.ScaleLinear<number, number>;
        otherScale?: d3.GenericScale<any, any>; //d3.ScaleLinear<number, number> | d3.ScalePoint<string>;
        sizeScale?: d3.ScaleLinear<number, number>;

        quadrantLineHorizontal?: d3.DatalessSelection;
        quadrantLineVertical?: d3.DatalessSelection;
        quadrantLabels?: d3.DataSelection<string>;

        dragArea?: d3.DatalessSelection;

        circlesContainerGroup?: d3.DatalessSelection;
        circlesContainerRoot?: d3.DatalessSelection;
        circlesContainerInner?: d3.DatalessSelection;
        neighborhoodCircles?: d3.DataSelection<Neighborhood>;
        listingCircles?: d3.DataSelection<Listing>;
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        // Initialize our canvas
        let width = this.element.clientWidth;
        let height = this.element.clientHeight;

        this.view = {};
        this.view.padding = new d3.Padding(40);

        this.view.title = d3.select(this.element.parentElement).select('.title');
        this.view.overlay = d3.select(this.selector).append('div').attr('class', 'overlay');
        this.view.overlay
          .append('div')
            .attr('class', 'top-left')
            .style('top', '5px');

        this.view.overlay
          .select('div.top-left')
          .append('button')
            .attr('class', 'reset-zoom')
            .text('Reset Zoom');

        this.view.svg = d3.select(this.selector).append('svg')
            .attr('class', 'chart')
            .attr('width', width)
            .attr('height', height)
        
        this.attributeMap = [];
        this.attributeMap.push(Attribute.price);
        this.attributeMap.push(Attribute.monthlyPrice);
        this.attributeMap.push(Attribute.rating);
        this.attributeMap.push(Attribute.cancellationPolicy);

        // Select the default quadrant names
        this.quadrantNames = [];

        // Select the rating attribute by default
        this.selectedAttribute = this.attributeMap[0];
        this.selectedLevel = 'Neighborhoods';
        this.updateTitle();
    }

    private initializeQuadrants() {
        let quadrantsArea = this.view.svg
            .append('g').attr('class', 'quadrant-area');

        this.view.quadrantLineHorizontal = quadrantsArea
            .append('g').attr('class', 'quadrant-lines quadrant-horizontal')
            .append('line');

        this.view.quadrantLineVertical = quadrantsArea
            .append('g').attr('class', 'quadrant-lines quadrant-vertical')
            .append('line');

        let quadrantLabelsSelection = quadrantsArea
          .append('g').attr('class', 'quadrant-labels')
          .selectAll('text')
            .data(this.quadrantNames);
        let quadrantLabelsEnter = quadrantLabelsSelection.enter()
            .append('text')
            .text(d => d);
        this.view.quadrantLabels = quadrantLabelsSelection.merge(quadrantLabelsEnter);
    }

    private initializeAxes() {
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
    }

    private initializeLevelSelect() {
        let levelSelect = this.view.overlay.select('div.top-left')
          .append('select')
            .attr('class', 'level-select');
            
        let levelOptionsSelection = levelSelect.selectAll('option').data<'Neighborhoods'|'Listings'>(['Neighborhoods', 'Listings']);
        let levelOptionsEnter = levelOptionsSelection.enter()
          .append('option')
            .text(d => d)
            .attr('selected', d => d === this.selectedLevel ? true : undefined);
        let levelOptions = levelOptionsSelection.merge(levelOptionsEnter);

        levelSelect.on('change', () => {
            let index: number = levelSelect.property('selectedIndex');
            let level = levelOptions.filter((d,i) => i === index).datum();
            this.selectedLevel = level;
            this.render();
        });
    }

    

    private initializeDrag() {
        this.view.dragArea = this.view.circlesContainerRoot;
        this.view.dragArea
          .select('rect.backfill')
            .call(
                d3.drag()
                .filter(() => !event['altKey'])
                .subject(() => [[d3.event.x, d3.event.y], [d3.event.x, d3.event.y]])
                .on('start', () => this.selectionDragStarted())
            );
    }

    private selectionDragStarted() {
        let self = this;

        // Get the list of data positions of this path
        let d: [number,number][] = d3.event.subject;

        // Get the drag boundaries, and offsets
        let offsetX = +this.view.dragArea.attr('data-offset-x');
        let offsetY = +this.view.dragArea.attr('data-offset-y');
        let width = +this.view.dragArea.select('rect.backfill').attr('width');
        let height = +this.view.dragArea.select('rect.backfill').attr('height')
        
        // Get the drag position
        let x0: number = Math.max(0, Math.min(width, d3.event.x));
        let y0: number = Math.max(0, Math.min(height, d3.event.y));
        let didMove = false;

        let rectLeft = 0; 
        let rectTop = 0; 
        let rectWidth = 0; 
        let rectHeight = 0; 

        // Determine whether the resulting selection should be new or appended
        let newSelection = !d3.event.sourceEvent.shiftKey;
        
        let rect = this.view.dragArea
            .append('rect')
            .attr('class', 'drag-selection');

        d3.event
        .on('drag', () => {
            didMove = true;

            // console.log(d3.event);
            let x1: number = Math.max(0, Math.min(width, d3.event.x));
            let y1: number = Math.max(0, Math.min(height, d3.event.y));

            rectLeft = Math.min(x0, x1);
            rectTop = Math.min(y0, y1);
            rectWidth = Math.abs(x1 - x0);
            rectHeight = Math.abs(y1 - y0);
            rect.attr('x', rectLeft)
                .attr('y', rectTop)
                .attr('width', rectWidth)
                .attr('height', rectHeight);
        })
        .on('end', () => {
            if (!didMove) {
                rectLeft = x0;
                rectTop = y0;
            }

            // Select the actual elements
            let svgNode: SVGSVGElement = <SVGSVGElement>this.view.svg.node();
            let rectNode: SVGSVGElement = <SVGSVGElement>rect.node();

            let selectionRect = svgNode.createSVGRect();
            selectionRect.x = rectLeft + offsetX;
            selectionRect.y = rectTop + offsetY;
            selectionRect.width = rectWidth;
            selectionRect.height = rectHeight;
            let nodes = svgNode.getIntersectionList(selectionRect, null);

            if (this.selectedLevel === 'Neighborhoods') {
                let neighborhoods: Neighborhood[] = [];
                let selection: SelectEventData;

                for (let i = 0; i < nodes.length; i++) {
                    let data = nodes.item(i)['__data__'];

                    // Current selected node is a neighborhood
                    if (data && data['listings'] !== undefined) {
                        neighborhoods.push(data);
                    }
                }
                
                if (newSelection) {
                    // Overwrite the selection with the selected neighborhoods
                    selection = Dispatch.emptySelection();
                    selection.neighborhoods = neighborhoods;
                }
                else {
                    // Add any newly selected neighborhoods to the selection
                    selection = Dispatch.cloneSelection(this.selection);

                    for (let n of neighborhoods) {
                        if (selection.neighborhoods.indexOf(n) === -1)
                            selection.neighborhoods.push(n);
                    }
                }

                this.dispatcher.call(DispatchEvent.Select, this, selection);
            }
            else {
                let listings: Listing[] = [];
                let selection: SelectEventData;

                for (let i = 0; i < nodes.length; i++) {
                    let data = nodes.item(i)['__data__'];

                    // Current selected node is a listing
                    if (data && data['neighborhood'] !== undefined) {
                        listings.push(data);
                    }
                }

                if (newSelection) {
                    // Overwrite the selection with the selected listings
                    selection = Dispatch.emptySelection();
                    selection.listings = listings;
                }
                else {
                    // Add any newly selected listings to the selection
                    selection = Dispatch.cloneSelection(this.selection);

                    for (let l of listings) {
                        if (selection.listings.indexOf(l) === -1)
                            selection.listings.push(l);
                    }
                }

                this.dispatcher.call(DispatchEvent.Select, this, selection);
            }

            // Remove the path from existence
            // path.remove();
            rect.remove();
        });
    }

    private initializeCircles() {
        this.view.circlesContainerGroup = this.view.svg.append('g').attr('class', 'circles-container');
        this.view.circlesContainerRoot = this.view.circlesContainerGroup.append('svg');
        this.view.circlesContainerRoot.append('rect').attr('class', 'backfill').style('cursor', 'crosshair');
        this.view.circlesContainerInner = this.view.circlesContainerRoot.append('g');
    }

    private updateTitle() {
        let title = '';

        if (this.selectedLevel === 'Neighborhoods')
            title += 'Neighborhood ';
        else   
            title += 'Individual ';

        title += ' Markup vs. ';
        title += this.selectedAttribute.name;

        this.view.title.text(title);
    }

    private updateScales() {
        let width = this.element.clientWidth;
        let height = this.element.clientHeight;
        let innerPadding = d3.Padding.add(this.view.padding, new d3.Padding(0, 40, 40, 0));

        let markupDomain: any;
        let sizeDomain: any;
        let otherDomain: any;

        // Determine the domains of the scales
        if (this.selectedLevel === 'Neighborhoods') {
            let data = this.filteredNeighborhoods;
            markupDomain = Attribute.markup.neighborhoodDomain(data);
            sizeDomain = Attribute.count.neighborhoodDomain(data);
            otherDomain = this.selectedAttribute.neighborhoodDomain(data);
        }
        else {
            let data = this.filteredListings;
            markupDomain = Attribute.markup.listingDomain(data);
            sizeDomain = Attribute.count.listingDomain(data);
            otherDomain = this.selectedAttribute.listingDomain(data);
        }

        // Update the domains of the scales
        this.view.markupScale = d3.scaleLinear().domain(markupDomain);
        this.view.sizeScale = d3.scaleLinear().domain(sizeDomain);

        if (this.selectedAttribute.kind === 'continuous') { 
            this.view.otherScale = d3.scaleLinear().domain(otherDomain);
        }
        else if (this.selectedAttribute.kind === 'ordinal') {
            this.view.otherScale = d3.scalePoint().domain(otherDomain).padding(1);
        }

        // Update the ranges of the scales
        this.view.markupScale.range([innerPadding.height(height) + innerPadding.top, innerPadding.top]);
        this.view.otherScale.range([innerPadding.left, innerPadding.left + innerPadding.width(width)]);

        if (this.selectedLevel === 'Neighborhoods') {
            this.view.sizeScale.range([5, 30]);
        }
        else {
            this.view.sizeScale.range([5, 5]);
        }
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);

        this.initializeQuadrants();
        this.initializeAxes(); 
        this.initializeLevelSelect();
        this.initializeCircles();
        this.initializeDrag();

        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);

        if (this.selectedLevel === 'Neighborhoods') {
            this.view.neighborhoodCircles.attr('fill', d => this.getNeighborhoodCircleFill(d));
        }
        else {
            this.view.listingCircles.attr('fill', d => this.getListingCircleFill(d));
        }
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);

        if (this.selectedLevel === 'Neighborhoods') {
            this.view.neighborhoodCircles.attr('fill', d => this.getNeighborhoodCircleFill(d));
        }
        else {
            this.view.listingCircles.attr('fill', d => this.getListingCircleFill(d));
        }
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
        this.render();
    }

    public resize() {

    }

    private getNeighborhoodCircleFill(neighborhood: Neighborhood) : string {
        let selectedNeighborhoods = this.selection.neighborhoods || [];
        let highlightedNeighborhood = this.highlight.neighborhood;

        if (selectedNeighborhoods.indexOf(neighborhood) !== -1) {
            return 'rgba(255, 100, 100, 0.5)';
        }
        else {
            if (neighborhood === highlightedNeighborhood) 
                return 'rgba(255, 100, 100, 0.5)';
            else
                return 'rgba(50, 50, 100, 0.5)';
        }
    }

    private getListingCircleFill(listing: Listing) : string {
        let selectedListings = this.allSelectedListings;
        let highlightedListing = this.highlight.listing;
        
        if (selectedListings.indexOf(listing) !== -1) {
            return 'rgba(255, 100, 100, 0.5)';
        }
        else {
            if (this.highlight.listing === listing || this.highlight.neighborhood === listing.neighborhood) 
                return 'rgba(255, 100, 100, 0.5)';
            else
                return 'rgba(50, 50, 100, 0.5)';
        }
    }

    private drawQuadrants(width: number, height: number, transition = d3.transition(null)) {
        // TODO: determine how these quadrants will be placed
        let quadrantSplitX = width/2;
        let quadrantSplitY = height/2;
        let padding = 5;

        this.view.quadrantLineHorizontal
            .attr('x1', 0)
            .attr('x2',  width)
          .transition(transition)
            .attr('y1', quadrantSplitY)
            .attr('y2', quadrantSplitY);

        this.view.quadrantLineVertical
            .attr('y1', 0)
            .attr('y2', height)
          .transition(transition)
            .attr('x1', quadrantSplitX)
            .attr('x2', quadrantSplitX);
            

        this.view.quadrantLabels
            .attr('x', (d,i) => {
                // Indices 0 and 2 are on the left quadrants
                // Indices 1 and 3 are on the right quadrants
                return padding + ((i === 0 || i === 2) ? 0 : quadrantSplitX);
            })
            .attr('y', (d,i) => {
                // Indices 0 and 1 are on the top quadrants
                // Indices 2 and 3 are on the bottom quadrants
                return padding + ((i === 0 || i === 1) ? 0 : quadrantSplitY);
            });
    }

    private drawNeighborhoods(transition = d3.transition(null)) {
        let neighborhoodsTransitionActions = () => {
            let circleSelection = this.view.circlesContainerInner
                .selectAll('circle.neighborhood')
                    .data(this.filteredNeighborhoods, (n: Neighborhood) => n.name);

            let circleEnter = circleSelection.enter()
                .append('circle')
                .attr('class', 'neighborhood')
                .attr('opacity', 0)
                .attr('cx', d => this.view.otherScale(this.selectedAttribute.neighborhoodAccessor(d)) )
                .attr('cy', d => this.view.markupScale(Attribute.markup.neighborhoodAccessor(d)))
                .attr('r', d => this.view.sizeScale(Attribute.count.neighborhoodAccessor(d)))
                .on('mouseenter', d => this.dispatchNeighborhoodHighlight(d, true))
                .on('mouseleave', d => this.dispatchNeighborhoodHighlight(d, false))
                .on('click', d => this.dispatchNeighborhoodSelection(d, !d3.event.shiftKey));

            circleSelection.exit()
              .transition().duration(250)
                .attr('opacity', 0)
                .remove();

            this.view.neighborhoodCircles = circleSelection.merge(circleEnter);
            this.view.neighborhoodCircles
              .transition().duration(1000)
                .attr('opacity', 1)
                .attr('cx', d => this.view.otherScale(this.selectedAttribute.neighborhoodAccessor(d)))
                .attr('cy', d => this.view.markupScale(Attribute.markup.neighborhoodAccessor(d)))
                .attr('r', d => this.view.sizeScale(Attribute.count.neighborhoodAccessor(d)))
                .attr('fill', d => this.getNeighborhoodCircleFill(d));
        }

        if (this.view.neighborhoodCircles && this.view.listingCircles) {
            this.view.listingCircles
                .style('pointer-events', 'none')
              .transition(transition)
                .attr('cx', d => this.view.otherScale(this.selectedAttribute.neighborhoodAccessor(d.neighborhood)))
                .attr('cy', d => this.view.markupScale(Attribute.markup.neighborhoodAccessor(d.neighborhood)))
              .transition()
                .attr('r', d => this.view.sizeScale(Attribute.count.neighborhoodAccessor(d.neighborhood)))
                .attr('opacity', 0);

            this.view.neighborhoodCircles
                .style('pointer-events', 'auto')
                .attr('cx', d => this.view.otherScale(this.selectedAttribute.neighborhoodAccessor(d)))
                .attr('cy', d => this.view.markupScale(Attribute.markup.neighborhoodAccessor(d)))
                .attr('r', d => this.view.sizeScale(Attribute.count.neighborhoodAccessor(d)))
              .transition(transition)
              .transition().duration(1000)
                .attr('opacity', 1);

            transition.on('end', neighborhoodsTransitionActions);
        }
        else if (this.view.listingCircles) {
            this.view.listingCircles
                .style('pointer-events', 'none')
              .transition(transition)
                .attr('opacity', 0);
                
            transition.on('end', neighborhoodsTransitionActions);
        }
        else {
            neighborhoodsTransitionActions();
        }
    }

    private drawListings(transition = d3.transition(null)) {
        let listingsTransitionActions = () => {
            let circleSelection = this.view.circlesContainerInner
                .selectAll('circle.listing')
                    .data(this.filteredListings, (l: Listing) => l.id + '');

            let circleEnter = circleSelection.enter()
                .append('circle')
                .attr('class', 'listing')
                .attr('opacity', 0)
                .attr('cx', d => this.view.otherScale(this.selectedAttribute.accessor(d)))
                .attr('cy', d => this.view.markupScale(Attribute.markup.accessor(d)))
                .attr('r', d => this.view.sizeScale(Attribute.price.accessor(d)))
                .on('mouseenter', d => this.dispatchListingHighlight(d, true))
                .on('mouseleave', d => this.dispatchListingHighlight(d, false))
                .on('click', d => this.dispatchListingSelection(d, !d3.event.shiftKey));

            circleSelection.exit()
              .transition().duration(250)
                .attr('opacity', 0)
                .remove();

            this.view.listingCircles = circleSelection.merge(circleEnter);
            this.view.listingCircles
              .transition().duration(1000)
                .attr('opacity', 1)
                .attr('cx', d => this.view.otherScale(this.selectedAttribute.accessor(d)))
                .attr('cy', d => this.view.markupScale(Attribute.markup.accessor(d)))
                .attr('r', d => this.view.sizeScale(Attribute.price.accessor(d)))
                .attr('fill', d => this.getListingCircleFill(d))
        };

        if (this.view.listingCircles && this.view.neighborhoodCircles) {
            transition.duration(100);
            
            this.view.listingCircles
                .style('pointer-events', 'auto')
              .transition(transition)
                .attr('opacity', 1);

            this.view.neighborhoodCircles
                .style('pointer-events', 'none')
              .transition(transition)
                .attr('opacity', 0);

            transition.on('end', listingsTransitionActions);
        }
        else if (this.view.neighborhoodCircles) {
            this.view.neighborhoodCircles
                .style('pointer-events', 'none')
              .transition(transition)
                .attr('opacity', 0);

            transition.on('end', listingsTransitionActions);
        }
        else {
            listingsTransitionActions();
        }
    }

        private scaleTransition() {
        
        }

    public render() {
        let self = this;

        let width = this.element.clientWidth;
        let height = this.element.clientHeight;

        // Create the padding for the scatter plot itself
        let innerPadding = d3.Padding.add(this.view.padding, new d3.Padding(0, 40, 40, 0));

        this.updateTitle();
        this.updateScales();

        let updateTransition = d3.transition(null).duration(1000);

        let markupAxis = d3.axisLeft(this.view.markupScale);
        let otherAxis = d3.axisBottom(this.view.otherScale);

        //zoom to function
        var zoom = d3.zoom()
            .filter(function() {
                // Only allow zooming on scroll wheel, or panning on alt-click
                if (event instanceof WheelEvent)
                    return true;
                else if (event instanceof MouseEvent)
                    return event.button === 0 && event.altKey;
                else
                    return false;
            })
            .on('zoom', function() {
                let transform: d3.ZoomTransform = d3.event.transform;
            
                //update axis
                self.view.svg.select('g.other-axis').call(otherAxis.scale(transform.rescaleX(self.view.otherScale)));
                self.view.svg.select('g.markup-axis').call(markupAxis.scale(transform.rescaleY(self.view.markupScale)));

                //zoom to neighborhoods
                if (self.view.neighborhoodCircles) {
                    self.view.neighborhoodCircles
                        .attr('transform', transform + '')
                        .attr('r', d => self.view.sizeScale(Attribute.count.neighborhoodAccessor(d)) / transform.k);
                }

                //zoom to listings
                if (self.view.listingCircles) {
                    self.view.listingCircles
                        .attr('transform', transform + '')
                        .attr('r', d => self.view.sizeScale(Attribute.count.accessor(d)) / transform.k);
                }
            });


        //reset zoom  
        this.view.overlay.select('.reset-zoom').on('click',function(){
            markupAxis = d3.axisLeft(self.view.markupScale);
            otherAxis = d3.axisBottom(self.view.otherScale);

            self.view.svg.select('g.other-axis').transition(updateTransition).call(otherAxis);
            self.view.svg.select('g.markup-axis').transition(updateTransition).call(markupAxis);
            
             if (self.view.neighborhoodCircles) {
             self.view.neighborhoodCircles.transition(updateTransition).attr("transform",function(d){
                return "translate(0,0)scale(1)" ;
            });
             }

            if (self.view.listingCircles) {
           self.view.listingCircles.transition(updateTransition).attr("transform",function(d){
                return "translate(0,0)scale(1)";
            });
            }
              self.view.circlesContainerRoot.transition(updateTransition).call(zoom.transform, d3.zoomIdentity)

        });


        //call if in drag area
        this.view.circlesContainerRoot.call(zoom);

        // Draw the axes
        this.view.svg.select('g.markup-axis')
            .style('transform', innerPadding.translateX(0))
            .transition(updateTransition)
            .call(markupAxis);

        this.view.svg.select('g.other-axis')
            .style('transform', innerPadding.translateY(innerPadding.height(height)))
            .transition(updateTransition)
            .call(otherAxis);

        // Draw axis labels
        this.view.svg.select('g.markup-axis-label')
            .style('transform', `translate(${this.view.padding.left}px, ${innerPadding.centerY(height)}px)`);

        // Draw the quadrant lines and labels
        this.view.svg.select('g.quadrant-area').style('transform', innerPadding.translate(0,0));
        // this.drawQuadrants(innerPadding.width(width), innerPadding.height(height), updateTransition);


        // Update the drag area
        // this.view.dragArea
        //     .style('transform', innerPadding.translate(0,0))
        //   .select('rect')
        //     .attr('width', innerPadding.width(width))
        //     .attr('height', innerPadding.height(height));
        
        this.view.overlay
          .select('div.other-axis-label')
            .style('left', `${innerPadding.centerX(width)}px`)
            .style('top', `${height - this.view.padding.bottom}px`)
            .style('transform', 'translateX(-50%)');

        // Update the circles container 
        this.view.circlesContainerGroup.style('transform', innerPadding.translate(0,0));
        this.view.circlesContainerRoot
            .attr('width', innerPadding.width(width))
            .attr('height', innerPadding.height(height));
        this.view.circlesContainerRoot
            .attr('data-offset-x', innerPadding.left)
            .attr('data-offset-y', innerPadding.top)
          .select('rect.backfill')
            .attr('width', innerPadding.width(width))
            .attr('height', innerPadding.height(height))
            .style('fill', 'transparent');
        this.view.circlesContainerInner
            .attr('transform', `translate(-${innerPadding.left} -${innerPadding.top})`);

        // Draw the items
        // TODO: Remove all this dumb duplication when you're not tired
        if (this.selectedLevel === 'Neighborhoods') {
            this.drawNeighborhoods(updateTransition);
        }
        else if (this.selectedLevel === 'Listings') {
            this.drawListings(updateTransition);
        }



		}
		 

} 
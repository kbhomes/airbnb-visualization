import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { NeighborhoodGeoJSON, NeighborhoodGeoJSONFeature } from '../data/geojson';
import { Attribute } from '../data/attribute';
import { Listing, Neighborhood } from '../data/listing';

interface LegendItem {
    representative: number,
    text: string,
    min: number,
    max: number
}

export class NeighborhoodMapComponent extends BaseComponent {

    private view: {
        svg?: d3.DatalessSelection;
        pathsContainer?: d3.DatalessSelection;
        paths?: d3.DataSelection<NeighborhoodGeoJSONFeature>;
        legend?: d3.DataSelection<LegendItem>;
        moneyFormat?: (n:number) => string;
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        // Initialize our canvas
        let width = this.element.clientWidth,
            height = this.element.clientHeight;

        this.view = {};
        this.view.moneyFormat = d3.format('$.2f');
        this.view.svg = d3.select(this.selector).append('svg')
            .attr('class', 'map-chart')
            .attr('width', width)
            .attr('height', height);
        this.view.pathsContainer = this.view.svg.append('g')
            .attr('class', 'map-container')
            .attr('transform', 'translate(0 -20)');
    }

    private initializeLegend() {
        let width = this.element.clientWidth,
            height = this.element.clientHeight;

        let legendGroup = this.view.svg
          .append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(10, ${height - 30})`);

        let legendItems: LegendItem[] = [
            { representative: 0, text: '$0 - $200', min: 0, max: 200 },
            { representative: 200, text: '$200 - $300', min: 200, max: 300 },
            { representative: 300, text: '$300 - $400', min: 300, max: 400 },
            { representative: 400, text: '$400 - $600', min: 400, max: 600 },
            { representative: 600, text: '$600 - $1000', min: 600, max: 1000 },
            { representative: 1000, text: '$1000 - $1600', min: 1000, max: 1600 }
        ];

        let itemWidth = (width - 20) / legendItems.length;
        let rectSize = 12;

        let itemSelection = legendGroup
          .selectAll('g.legend-item')
            .data(legendItems);

        let itemEnter = itemSelection
          .enter()
          .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d,i) => `translate(${i*itemWidth}, 0)`);
        itemEnter
          .append('rect')
            .attr('width', rectSize)
            .attr('height', rectSize)
            .style('fill', d => this.getColor(d.representative));
        itemEnter
          .append('text')
            .text(d => d.text)
            .attr('x', rectSize + 2)
            .attr('y', rectSize / 2);

        this.view.legend = itemSelection.merge(itemEnter);
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);
        this.initializeLegend();
        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
        this.view.paths.attr('fill', d => this.getNeighborhoodRegion(this.filteredNeighborhoodMap.get(d.properties.neighborho)));
        
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);
        this.view.paths.attr('fill', d => this.getNeighborhoodRegion(this.filteredNeighborhoodMap.get(d.properties.neighborho)));
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
        this.view.paths.attr('fill', d => this.getNeighborhoodRegion(this.filteredNeighborhoodMap.get(d.properties.neighborho)));
    }

    public resize() {

    }

    private getNeighborhoodRegion(neighborhood:Neighborhood): string {
        if(neighborhood == undefined){
            return 'grey';
        }

        if (this.selection.neighborhoods.indexOf(neighborhood) !== -1 || neighborhood === this.highlight.neighborhood ) {
            return 'rgba(255, 100, 100, 0.5)';
        }
        
        if (this.selection.listings.length && this.selection.listings.some(l => l.neighborhood === neighborhood)) {
                return 'rgba(255, 100, 100, 0.5)';
        }
        
        if (this.highlight.listing && this.highlight.listing.neighborhood === neighborhood) {
            return 'rgba(255, 100, 100, 0.5)';
        }
        
        return this.shadeOfGreen(neighborhood);
    }

//returns shade of green
    public shadeOfGreen(neighborhood:Neighborhood):string{
        let average = Attribute.price.neighborhoodAccessor(neighborhood);

        return this.getColor(average);
        
    }
//return green based on price
//color scale: https://color.adobe.com/greens-color-theme-7334761/edit/?copy=true&base=2&rule=Custom&selected=4&name=Copy%20of%20greens&mode=hsv&rgbvalues=0,0.15,0.09999959999997828,0.013500000000000014,0.27,0.14602431599999785,0.07820000000000002,0.46,0.20546692119988363,0.21170000000000003,0.73,0.2721690243998254,0.49455095400014937,0.9,0.423&swatchOrder=0,1,2,3,4 for each green
    private getColor(averageNeighborhoodPrice):string{

        if(averageNeighborhoodPrice>=0 && averageNeighborhoodPrice < 200 ){
            return 'rgb(204,236,230)';
        }else if(averageNeighborhoodPrice>=200 && averageNeighborhoodPrice< 300 ){
            return 'rgb(153,216,201)';
        }else if(averageNeighborhoodPrice>=300 && averageNeighborhoodPrice<400 ){
            return 'rgb(102,194,164)';
        }else if(averageNeighborhoodPrice>=400 && averageNeighborhoodPrice<600 ){
            return 'rgb(65,174,118)';
        }else if(averageNeighborhoodPrice>=600 && averageNeighborhoodPrice<1000){
            return 'rgb(35,139,69)'
        }else if(averageNeighborhoodPrice>=1000 && averageNeighborhoodPrice<1600){
            return 'rgb(0,88,36)';
        }

        return 'rgb(38,38,38)';
    }

    private getNeighborhoodAverages(){
        
    }

    public render() {
        let self = this;

        let width = this.element.clientWidth,
            height = this.element.clientHeight;

        let projection = d3.geoMercator()
            .scale(1)
            .translate([0, 0])
            .precision(0);
            
        let path = d3.geoPath().projection(projection);
        let bounds = path.bounds(this.data.geo);

        let xScale = width / Math.abs(bounds[1][0] - bounds[0][0]);
        let yScale = height / Math.abs(bounds[1][1] - bounds[0][1]);
        let scale = xScale < yScale ? xScale : yScale;
        let transl: [number, number] = [
            (width - scale * (bounds[1][0] + bounds[0][0])) / 2, 
            (height - scale * (bounds[1][1] + bounds[0][1])) / 2
        ];

        projection
            .scale(scale)
            .translate(transl);

        
        let pathsSelection = this.view.pathsContainer.selectAll('path')
            .data(this.data.geo.features, d => d['id']);

        // Draw all the neighborhoods for the first time
        let pathsEnter = pathsSelection.enter()
          .append('path')
            .attr('d', path)
            .attr('data-id', d => d.id)
            .attr('data-name', d => d.properties.neighborho)
            .attr('fill', d => this.getNeighborhoodRegion(this.filteredNeighborhoodMap.get(d.properties.neighborho)))
            .style('stroke', '#FFFFFF')
            .on('mouseenter', function(d) {
                // If this neighborhood was filtered out, do nothing
                if (!self.filteredNeighborhoodMap.has(d.properties.neighborho))
                    return;

                // Dispatch a highlight event for this neighborhood

                let selectedNeighborhood =  self.filteredNeighborhoodMap.get(d.properties.neighborho)
                self.dispatchNeighborhoodHighlight(selectedNeighborhood,true);

  
                // let sel = d3.select(this);
                // // Scale up the particular neighborhood. 
                // sel.moveToFront();

                // let box = (sel.node() as SVGPathElement).getBBox();
                
                // // Do some really naive clamping to get already large neighborhood slightly scaled,
                // // and teeny tiny neighborhoods more highly scaled. The 2500 figures from a bounding
                // // box of approximately 50x50. Scale factor remains in range [1.5, 2.5].
                // let scale = Math.min(2.5, Math.max(1.5, 2500 / (box.width * box.height)));
                // let cx = box.x + box.width/2;
                // let cy = box.y + box.height/2;
                
                // sel.transition()
                //     .style('transform', `translate(-${(scale - 1) * cx}px, -${(scale - 1) * cy}px) scale(${scale})`);
            })
            .on('mouseleave', function(d) {
                // If this neighborhood was filtered out, do nothing
                if (!self.filteredNeighborhoodMap.has(d.properties.neighborho))
                    return;

                // Dispatch an empty highlight event
               let selectedNeighborhood =  self.filteredNeighborhoodMap.get(d.properties.neighborho)
                self.dispatchNeighborhoodHighlight(selectedNeighborhood,false);

                // let sel = d3.select(this);
                // sel.transition()
                //     .style('transform', `translate(0px, 0px) scale(1.0)`)
                //     .on('end', () => sel.moveToBack());
            }).on('click', function(d){
                // If this neighborhood was filtered out, do nothing
                if (!self.filteredNeighborhoodMap.has(d.properties.neighborho))
                    return;
                    
                let selectedNeighborhood =  self.filteredNeighborhoodMap.get(d.properties.neighborho)
                self.dispatchNeighborhoodSelection(selectedNeighborhood, !d3.event.shiftKey);

                

            });

        //label each neighborhood
        //TODO: tidy label up 
        let labelSelection = this.view.pathsContainer
          .selectAll('g.map-label')
            .data(this.data.geo.features);
        
        let labelEnter = labelSelection.enter()
          .append('g')
            .attr('class', 'map-label')
            .attr('transform', d => {
                let [x, y] = path.centroid(d);
                return `translate(${x} ${y - 12})`
            })
          .append('text')
            .attr('x', 0)
            .attr('y', 0);

        labelEnter.append('tspan')
            .attr('class', 'map-label-name')
            .attr('x', 0)
            .attr('dy', '1.2em')
            .text(d => d.properties.neighborho);

        labelEnter.append('tspan')
            .attr('class', 'map-label-price')
            .attr('x', 0)
            .attr('dy', '1.2em')
            .text(d => {
                let neighborhood = this.data.neighborhoods.get(d.properties.neighborho);  
                if (neighborhood){
                    return this.view.moneyFormat(Attribute.price.neighborhoodAccessor(neighborhood));
                }
                else {
                    return ''
                }
            });
                   
        // Create the update selection
        this.view.paths = pathsEnter.merge(pathsSelection);
    }
} 
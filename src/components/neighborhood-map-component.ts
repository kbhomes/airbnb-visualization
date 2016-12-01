import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { NeighborhoodGeoJSON, NeighborhoodGeoJSONFeature } from '../data/geojson';
import { Attribute } from '../data/attribute';
import { Listing, Neighborhood } from '../data/listing';
export class NeighborhoodMapComponent extends BaseComponent {

    private view: {
        svg?: d3.Selection<d3.BaseType, {}, d3.BaseType, {}>;
        paths?: d3.Selection<d3.BaseType, NeighborhoodGeoJSONFeature, d3.BaseType, {}>;
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        // Initialize our canvas
        let width = this.element.clientWidth,
            height = this.element.clientHeight;

        this.view = {};
        this.view.svg = d3.select(this.selector).append('svg')
            .attr('class', 'map-chart')
            .attr('width', width)
            .attr('height', height);
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);
        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
            this.view.paths.attr('fill', d => this.getNeighborhoodRegion(this.data.neighborhoods.get(d.properties.neighborho)));
        
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);
            this.view.paths.attr('fill', d => this.getNeighborhoodRegion(this.data.neighborhoods.get(d.properties.neighborho)));
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
    }

    public resize() {

    }

    private getNeighborhoodRegion(neighborhood:Neighborhood):string{
        let selectedNeighborhoods = this.selection.neighborhoods || [];
        let highlightedNeighborhood = this.highlight.neighborhood;
        
        if(neighborhood == undefined){
            return 'grey'
        }

        if (selectedNeighborhoods.indexOf(neighborhood) !== -1 || neighborhood === highlightedNeighborhood ) {
            return 'rgba(255, 100, 100, 0.5)';
        }else {
            return this.shadeOfGreen(neighborhood);
        }
    }

//returns shade of green
    public shadeOfGreen(neighborhood:Neighborhood):string{

      
        
        let currentNeighborhood = this.data.neighborhoods.get(neighborhood.name); 
        let average = Attribute.price.neighborhoodAccessor(currentNeighborhood);

        return this.getColor(average);
        
    }
//return green based on price
//color scale: https://color.adobe.com/greens-color-theme-7334761/edit/?copy=true&base=2&rule=Custom&selected=4&name=Copy%20of%20greens&mode=hsv&rgbvalues=0,0.15,0.09999959999997828,0.013500000000000014,0.27,0.14602431599999785,0.07820000000000002,0.46,0.20546692119988363,0.21170000000000003,0.73,0.2721690243998254,0.49455095400014937,0.9,0.423&swatchOrder=0,1,2,3,4 for each green
    private getColor(averageNeighborhoodPrice):string{

        if(averageNeighborhoodPrice>0 && averageNeighborhoodPrice<=199 ){
            return 'rgb(126,229,108)';
        }
        if(averageNeighborhoodPrice>200 && averageNeighborhoodPrice<=300 ){
            return 'rgb(54,186,69)';
        }else if(averageNeighborhoodPrice>301 && averageNeighborhoodPrice<=399 ){
            return 'rgb(20,117,52)';
        }else if(averageNeighborhoodPrice>401 && averageNeighborhoodPrice<=600 ){
            return 'rgb(80,225,80)';
        }else if(averageNeighborhoodPrice>601 && averageNeighborhoodPrice<=1000){
            return 'rgb(3,69,37)'
        }else if(averageNeighborhoodPrice>1401 && averageNeighborhoodPrice<1600){
            return 'rgb(20,117,52)';
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

        
        let pathsSelection = this.view.svg.selectAll('path')
            .data(this.data.geo.features, d => d['id']);

        // Draw all the neighborhoods for the first time
        let pathsEnter = pathsSelection.enter()
          .append('path')
            .attr('d', path)
            .attr('data-id', d => d.id)
            .attr('data-name', d => d.properties.neighborho)
            .attr('fill', function(d){

                let neighborhood = self.data.neighborhoods.get(d.properties.neighborho);
                //if the neighborhood exists
                // return a color giving the price range
                return (neighborhood != undefined) ? self.shadeOfGreen(neighborhood) : 'grey';
            })
            .style('stroke', '#FFFFFF')
            .on('mouseenter', function(d) {
                // Dispatch a highlight event for this neighborhood

                let selectedNeighborhood =  self.data.neighborhoods.get(d.properties.neighborho)
                self.dispatchNeighborhoodHighlight(selectedNeighborhood,true);

  
                let sel = d3.select(this);
                // Scale up the particular neighborhood. 
                sel.moveToFront();

                let box = (sel.node() as SVGPathElement).getBBox();
                
                // Do some really naive clamping to get already large neighborhood slightly scaled,
                // and teeny tiny neighborhoods more highly scaled. The 2500 figures from a bounding
                // box of approximately 50x50. Scale factor remains in range [1.5, 2.5].
                let scale = Math.min(2.5, Math.max(1.5, 2500 / (box.width * box.height)));
                let cx = box.x + box.width/2;
                let cy = box.y + box.height/2;
                
                sel.transition()
                    .style('transform', `translate(-${(scale - 1) * cx}px, -${(scale - 1) * cy}px) scale(${scale})`);
            })
            .on('mouseleave', function(d) {
                // Dispatch an empty highlight event
               let selectedNeighborhood =  self.data.neighborhoods.get(d.properties.neighborho)
                self.dispatchNeighborhoodHighlight(selectedNeighborhood,false);

                let sel = d3.select(this);
                sel.transition()
                    .style('transform', `translate(0px, 0px) scale(1.0)`)
                    .on('end', () => sel.moveToBack());
            }).on('click', function(d){

                    
                let selectedNeighborhood =  self.data.neighborhoods.get(d.properties.neighborho)
                self.dispatchNeighborhoodSelection(selectedNeighborhood);

                

            });
                //label each neighborhood
                //TODO: tidy label up 
                var label = this.view.svg.selectAll("text")
                    .data(this.data.geo.features)
                    .enter()
                    .append("text")
                    .attr("class", "label")
                    .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
                    .text(function(d) { 
                        let neighborhood = self.data.neighborhoods.get(d.properties.neighborho);  
                        let price = '0';
                        if (neighborhood != undefined){
                           price = Attribute.price.neighborhoodAccessor(neighborhood);
                           return d.properties.neighborho +" $"+price ; 
                        }
                        return d.properties.neighborho +" $"+price;
                    })
                    .attr('font-size',8);
                   
        // Create the update selection
        this.view.paths = pathsEnter.merge(pathsSelection);
    }
} 
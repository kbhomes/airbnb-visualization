import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { NeighborhoodGeoJSON, NeighborhoodGeoJSONFeature } from '../data/geojson';
import { Attribute } from '../data/attribute';
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
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);

    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
    }

    public resize() {

    }
//returns shade of green
    public shadeOfGreen(neighborhood):string{

        let average = this.getNeighborhoodPriceAverage(neighborhood)

        return this.getColor(average);
        
    }
//return green based on price
//color scale: https://color.adobe.com/This-Green-color-theme-8084268/ for each green
    private getColor(averageNeighborhoodPrice):string{

        if(averageNeighborhoodPrice>200 && averageNeighborhoodPrice<400 ){

            return 'rgb(100,255,100)';
        }else if(averageNeighborhoodPrice>401 && averageNeighborhoodPrice<600 ){
            return 'rgb(80,225,80)';
        }else if(averageNeighborhoodPrice>601 && averageNeighborhoodPrice<800){
            return 'rgb(60,195,60)'
        }else if(averageNeighborhoodPrice>801 && averageNeighborhoodPrice<1000){
            return 'rgb(40,165,40)'
        }else if(averageNeighborhoodPrice>1001 && averageNeighborhoodPrice<1200){
            return 'rgb(20,135,20)'
        } else if(averageNeighborhoodPrice>1001 && averageNeighborhoodPrice<1200){
            return 'rgb(10,105,00)'
        }else if(averageNeighborhoodPrice>1201 && averageNeighborhoodPrice<1400){
            return 'rgb(5,75,5)'
        }else if(averageNeighborhoodPrice>1401 && averageNeighborhoodPrice<1600){
            return 'rgb(0,45,0)'
        }

        return 'rgb(12,200,30)';
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
            .style('fill', function(d){

                let neighborhood = self.data.neighborhoods.get(d.properties.neighborho);
                //if the neighborhood exists
                // return a color giving the price range
                return (neighborhood != undefined) ? self.shadeOfGreen(neighborhood) : '#000000';
            })
            .style('stroke', '#FFFFFF')
            .on('mouseenter', function(d) {
                // Dispatch a highlight event for this neighborhood
                self.dispatcher.call(DispatchEvent.Highlight, this, {
                    neighborhood: self.data.neighborhoods.get(d.properties.neighborho),
                    listing: undefined
                } as HighlightEventData);
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
                    .style('fill', 'rgb(255,29,35)')
                    .style('transform', `translate(-${(scale - 1) * cx}px, -${(scale - 1) * cy}px) scale(${scale})`);
            })
            .on('mouseleave', function(d) {
                // Dispatch an empty highlight event
                self.dispatcher.call(DispatchEvent.Highlight, this, {
                    neighborhood: undefined,
                    listing: undefined
                } as HighlightEventData);

                let sel = d3.select(this);
                sel.transition()
                    .style('fill', self.shadeOfGreen(self.data.neighborhoods.get(d.properties.neighborho)))
                    .style('transform', `translate(0px, 0px) scale(1.0)`)
                    .on('end', () => sel.moveToBack());
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
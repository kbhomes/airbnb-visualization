import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData } from '../data/dispatch';
import { NeighborhoodGeoJSON } from '../data/geojson';

export class NeighborhoodMapComponent extends BaseComponent {
    private data: NeighborhoodGeoJSON;

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);
    }

    public onLoad(data: LoadEventData) {
        this.data = data.geo;
        this.render();
    }

    public onSelect() {

    }

    public onHighlight() {

    }

    public onFilter() {

    }

    public resize() {

    }

    public render() {
        let width = this.element.clientWidth,
            height = this.element.clientHeight;

        let svg = d3.select(this.selector).append('svg')
            .attr('class', 'map-chart')
            .attr('width', width)
            .attr('height', height);

        let projection = d3.geoMercator()
            .scale(1)
            .translate([0, 0])
            .precision(0);
            
        let path = d3.geoPath().projection(projection);
        let bounds = path.bounds(this.data);

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

        svg.selectAll('path')
            .data(this.data.features)
            .enter()
          .append('path')
            .attr('d', path)
            .attr('data-id', d => d.id)
            .attr('data-name', d => d.properties.name)
            .style('fill', '#FB5B1F')
            .style('stroke', '#FFFFFF')
            .on('mouseenter', function(d) { 
                d3.select(this).style('fill', '#FBAB8F');
            })
            .on('mouseleave', function(d) {
                d3.select(this).style('fill', '#FB5B1F');
            });
    }
} 
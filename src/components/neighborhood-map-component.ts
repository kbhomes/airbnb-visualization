import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { NeighborhoodGeoJSON } from '../data/geojson';

export class NeighborhoodMapComponent extends BaseComponent {

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);
        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
        this.render();
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);
        this.render();
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
        this.render();
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

        svg.selectAll('path')
            .data(this.data.geo.features)
            .enter()
          .append('path')
            .attr('d', path)
            .attr('data-id', d => d.id)
            .attr('data-name', d => d.properties.name)
            .style('fill', '#FB5B1F')
            .style('stroke', '#FFFFFF')
            .on('mouseenter', function(d) {
                // Scale up the particular neighborhood. 
                let sel = d3.select(this);
                sel.moveToFront();

                let box = (sel.node() as SVGPathElement).getBBox();

                // Do some really naive clamping to get already large neighborhood slightly scaled,
                // and teeny tiny neighborhoods more highly scaled. The 2500 figures from a bounding
                // box of approximately 50x50. Scale factor remains in range [1.5, 2.5].
                let scale = Math.min(2.5, Math.max(1.5, 2500 / (box.width * box.height)));
                let cx = box.x + box.width/2;
                let cy = box.y + box.height/2;
                
                sel.transition()
                    .style('fill', '#FBAB8F')
                    .style('transform', `translate(-${(scale - 1) * cx}px, -${(scale - 1) * cy}px) scale(${scale})`);
            })
            .on('mouseleave', function(d) {
                let sel = d3.select(this);
                sel.transition()
                    .style('fill', '#FB5B1F')
                    .style('transform', `translate(0px, 0px) scale(1.0)`);
            });
    }
} 
/// <reference path='d3.d.ts' />

interface NeighborhoodGeoJSONProperties {
    name: string;
}

interface NeighborhoodGeoJSON extends 
    d3.ExtendedFeatureCollection<
        d3.ExtendedFeature<
            GeoJSON.GeometryObject, 
            NeighborhoodGeoJSONProperties
        >
    > 
{

}

export function mapDemo() {
    let width = 600,
        height = 600;

    let svg = d3.select('.chart')
        .attr('width', width)
        .attr('height', height);

    let projection = d3.geoMercator()
        .scale(1)
        .translate([0, 0])
        .precision(0);

    d3.json('data/neighborhoods.geojson', (error, data: NeighborhoodGeoJSON) => {
        let path = d3.geoPath().projection(projection);
        let bounds = path.bounds(data);

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
            .data(data.features)
            .enter()
          .append('path')
            .attr('d', path)
            .attr('data-id', d => d.id)
            .attr('data-name', d => d.properties.name)
            .style('fill', '#FB5B1F')
            .style('stroke', '#FFFFFF');
    });
}
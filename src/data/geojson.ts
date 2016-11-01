import * as d3 from '../d3';

export interface NeighborhoodGeoJSONProperties {
    nbrhood: string;
}

export interface NeighborhoodGeoJSON extends d3.ExtendedFeatureCollection<d3.ExtendedFeature<GeoJSON.GeometryObject, NeighborhoodGeoJSONProperties>> {

}
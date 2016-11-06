import * as d3 from '../d3';

export interface NeighborhoodGeoJSONProperties {
    neighborho: string;
}

export interface NeighborhoodGeoJSONFeature extends d3.ExtendedFeature<GeoJSON.GeometryObject, NeighborhoodGeoJSONProperties> {
    
}

export interface NeighborhoodGeoJSON extends d3.ExtendedFeatureCollection<NeighborhoodGeoJSONFeature> {

}
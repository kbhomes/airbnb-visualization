import * as d3 from '../d3';

import { NeighborhoodGeoJSON } from './geojson';
import { Listing, Neighborhood } from './listing';

export type Dispatch = d3.Dispatch<EventTarget>;
export const DispatchEvent = {
    Load: 'load',
    Select: 'select',
    Highlight: 'highlight',
    Filter: 'filter'
};

export interface LoadEventData {
    geo: NeighborhoodGeoJSON;
    neighborhoods: Map<Neighborhood.NameType, Neighborhood>;
    listings: Map<Listing.IDType, Listing>;
}

export interface SelectEventData {
    neighborhoods: Neighborhood[];
    listings: Listing[];
}

export interface HighlightEventData {
    neighborhood: Neighborhood;
    listing: Listing;
}

export interface FilterEventData {
    filter: boolean;
}

// Load:
//      - geojson: map data
//      - neighborhoods: mapping from neighborhood name to listing ids
//      - listings: mapping from listing ids to listings

// Select:
//      - neighborhoods: array of neighborhood names
//      - listings: array of listing ids
//
// (either neighborhoods, or listings, or none)

// Highlight:
//      - neighborhood: neighborhood name
//      - listing: listing id
//
// (either neighborhoods, or listings, or none)

// Filter:
//      - filter: boolean (corresponds to 'display selection only')
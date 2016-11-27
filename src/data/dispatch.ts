import * as d3 from '../d3';

import { NeighborhoodGeoJSON } from './geojson';
import { Listing, Neighborhood } from './listing';
import { Block } from './block';

export type Dispatch = d3.Dispatch<any>;
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
    priceBlocks: Block[];
    markupBlocks: Block[];
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
//      - priceBlocks: list of blocks that contain the price ranges
//      - markupBlocks: list of blocks that contain the markup ranges

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
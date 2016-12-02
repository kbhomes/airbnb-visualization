import * as d3 from '../d3';

import { NeighborhoodGeoJSON } from './geojson';
import { Listing, Neighborhood } from './listing';
import { Block } from './block';

export type Dispatch = d3.Dispatch<any>;
export module Dispatch {
    export function isEmptySelection(selection: SelectEventData) {
        return (
            selection.neighborhoods.length === 0 &&
            selection.listings.length === 0 &&
            selection.priceBlocks.length === 0 &&
            selection.markupBlocks.length === 0 &&
            selection.amenities.length === 0
        );
    }

    export function emptySelection() : SelectEventData {
        return {
            neighborhoods: [],
            listings: [],
            priceBlocks: [],
            markupBlocks: [],
            amenities: []
        };
    }

    export function cloneSelection(selection: SelectEventData) {
        let cloned: SelectEventData = {
            neighborhoods: [],
            listings: [],
            priceBlocks: [],
            markupBlocks: [],
            amenities: []
        };

        if (selection.neighborhoods)
            cloned.neighborhoods = selection.neighborhoods.slice();

        if (selection.listings)
            cloned.listings = selection.listings.slice();

        if (selection.priceBlocks)
            cloned.priceBlocks = selection.priceBlocks.slice();

        if (selection.markupBlocks)
            cloned.markupBlocks = selection.markupBlocks.slice();

        if (selection.amenities)
            cloned.amenities = selection.amenities.slice();

        return cloned;
    }
}


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
    amenities: string[];
}

export interface SelectEventData {
    neighborhoods: Neighborhood[];
    listings: Listing[];
    priceBlocks: Block[];
    markupBlocks: Block[];
    amenities: string[];
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
//      - amenities: list of amenities that are tracked

// Select:
//      - neighborhoods: array of neighborhood names
//      - listings: array of listing ids
//      - priceBlocks: array of price blocks that are selected
//      - markupBlocks: array of markup blocks that are selected
//      - amenities: array of amenities that are selected
//
// (either neighborhoods, or listings, or price blocks, or markup blocks, or none)

// Highlight:
//      - neighborhood: neighborhood name
//      - listing: listing id
//
// (either neighborhoods, or listings, or none)

// Filter:
//      - filter: boolean (corresponds to 'display selection only')
export module Listing {
    export type IDType = number;
}

export module Neighborhood {
    export type NameType = string;
}

export interface Listing {
    id: Listing.IDType;
    neighborhoods: Neighborhood[];
}

export interface Neighborhood {
    name: Neighborhood.NameType;
    listings: Listing[];
}
import * as d3 from '../d3';
import { Listing, Neighborhood } from './listing';

export interface Attribute {
    name: string;
    accessor: (listing: Listing) => any; 
    neighborhoodAccessor: (neighborhood: Neighborhood) => any;

    kind: 'continuous' | 'ordinal';
    ordinalDomain?: string[];
}

export module Attribute {
    export var rating: Attribute = { 
        name: 'Rating', 
        accessor: l => l.reviews.rating, 
        neighborhoodAccessor: n => d3.mean(n.listings, l => l.reviews.rating),
        kind: 'continuous' 
    };

    export var price: Attribute = {
        name: 'Price', 
        accessor: l => l.prices.airbnb.daily, 
        neighborhoodAccessor: n => d3.median(n.listings, l => l.prices.airbnb.daily),
        kind: 'continuous'
    };

    export var markup: Attribute = {
        name: 'Markup', 
        accessor: l => l.prices.markup_percentage, 
        neighborhoodAccessor: n => d3.median(n.listings, l => l.prices.markup_percentage),
        kind: 'continuous'
    };

    export var cancellationPolicy: Attribute = { 
        name: 'Cancellation Policy', 
        accessor: l => l.cancellation_policy,
        neighborhoodAccessor: n => n.listings[0].cancellation_policy,
        kind: 'ordinal',
        ordinalDomain: ['flexible', 'moderate', 'strict', 'super_strict_30', 'super_strict_60']
    };
}
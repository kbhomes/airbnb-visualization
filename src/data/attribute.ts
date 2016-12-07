import * as d3 from '../d3';
import { Listing, Neighborhood } from './listing';

export interface Attribute {
    name: string;
    accessor: (listing: Listing) => any; 
    neighborhoodAccessor: (neighborhood: Neighborhood) => any;

    kind: 'continuous' | 'ordinal';
    listingDomain?: (data: Listing[]) => any;
    neighborhoodDomain?: (data: Neighborhood[]) => any;
}

export module Attribute {
    export var count: Attribute = {
        name: 'Count',
        accessor: l => 1,
        neighborhoodAccessor: n => n.listings.length,
        kind: 'continuous'
    };

    export var rating: Attribute = { 
        name: 'Rating', 
        accessor: l => l.reviews.rating, 
        neighborhoodAccessor: n => d3.mean(n.listings, l => l.reviews.rating),
        kind: 'continuous'
    };

    export var price: Attribute = {
        name: 'Airbnb Daily Price', 
        accessor: l => l.prices.airbnb.daily, 
        neighborhoodAccessor: n => d3.median(n.listings, l => l.prices.airbnb.daily),
        kind: 'continuous'
    };

    export var monthlyPrice: Attribute = {
        name: 'Monthly Price Per Bedroom', 
        accessor: l => l.prices.airbnb.monthly_per_bedroom, 
        neighborhoodAccessor: n => d3.median(n.listings, l => l.prices.airbnb.monthly_per_bedroom),
        kind: 'continuous'
    };

   export var truilaPrice: Attribute = {
        name: 'Trulia Daily Price', 
        accessor: l => l.prices.trulia.rent_per_bedroom/30, 
        neighborhoodAccessor: n => d3.median(n.listings, l => (l.prices.trulia.rent_per_bedroom/30)),
        kind: 'continuous'
    };

    export var markup: Attribute = {
        name: 'Markup', 
        accessor: l => l.prices.markup_percentage, 
        neighborhoodAccessor: n => d3.median(n.listings, l => l.prices.markup_percentage),
        kind: 'continuous'
    };

      export var numberOfReviews: Attribute = {
        name: '# of Reviews', 
        accessor: l => l.reviews.number_of_reviews, 
        neighborhoodAccessor: n => d3.median(n.listings, l => l.reviews.number_of_reviews),
        kind: 'continuous'
    };

       export var numberOfHostListings: Attribute = {
        name: '# of Host Listings', 
        accessor: l => l.host_listings_count, 
        neighborhoodAccessor: n => d3.median(n.listings, l => l.host_listings_count),
        kind: 'continuous'
    };


    export var cancellationPolicy: Attribute = { 
        name: 'Cancellation Policy', 
        accessor: l => l.cancellation_policy,
        neighborhoodAccessor: n => n.listings[0].cancellation_policy,
        kind: 'ordinal',
        listingDomain: (data) => ['flexible', 'moderate', 'strict', 'super_strict_30', 'super_strict_60'],
        neighborhoodDomain: (data) => ['flexible', 'moderate', 'strict', 'super_strict_30', 'super_strict_60']
    };

      export var numberOfGuestIncluded: Attribute = {
        name: '# of Guest Included', 
        accessor: l => l.guests_included, 
        neighborhoodAccessor: n => d3.median(n.listings, l => l.guests_included),
        kind: 'continuous'
    };

    // Set default domain accessors
    for (let attr of [count, rating, price, monthlyPrice, markup,truilaPrice,numberOfReviews,numberOfHostListings,numberOfGuestIncluded]) {
        attr.listingDomain = (data) => d3.extent(data, d => attr.accessor(d));
        attr.neighborhoodDomain = (data) => d3.extent(data, d => attr.neighborhoodAccessor(d));
    }
}
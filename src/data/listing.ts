import * as d3 from '../d3';
import { Block } from './Block';

export module Listing {
    // Parse the amenities into an array for the given amenities string
    function parseAmenities(amenities: string): string[] {
        return amenities
            .match(/{(.*?)}/)[1]
            .split(',')
            .map(l => {
                if (l.charAt(0) === '"') 
                    return l.substring(1, l.length - 1);
                else 
                    return l;
            });
    }

    export type IDType = number;
    export function parseCSVRow(row: d3.DSVRowString, neighborhood: Neighborhood) : Listing {
        return {
            id: +row['id'],
            name: row['name'],
            description: row['description'],
            neighborhood: neighborhood,
            priceBlock: undefined,
            markupBlock: undefined,
            amenities: parseAmenities(row['amenities']),
            cancellation_policy: row['cancellation_policy'],
            reviews: {
                number_of_reviews: +row['number_of_reviews'],
                number: +(row['number_of_reviews']),
                numberPerMonth: +(row['reviews_per_month']),
                rating: parseInt(row['review_scores_rating']),
                scores: {
                    accuracy: +row['review_scores_accuracy'],
                    cleanliness: +row['review_scores_cleanliness'],
                    checkin: +row['review_scores_checkin'],
                    communication: +row['review_scores_communication'],
                    location: +row['review_scores_location'],
                    value: +row['review_scores_value']
                }
            },
            guests_included: +row['guests_included'],
            host_listings_count: +row['host_listings_count'],
            prices: {
                markup_amount: +row['rent_difference'],
                markup_percentage: +row['rent_difference_percentage_of_median'] * 100,
                airbnb: {
                    daily: +row['price'],
                    monthly: +row['airbnb_monthly_rent'],
                    monthly_per_bedroom: +row['airbnb_monthly_rent_per_bedroom']
                },
                trulia: {
                    rent_per_bedroom: +row['trulia_median_rent_per_bedroom']
                }
            }
        };
    };
}

export module Neighborhood {
    export type NameType = string;
}

export interface Listing {
    id: Listing.IDType;
    name: string;
    description: string;
    neighborhood: Neighborhood;
    priceBlock: Block;
    markupBlock: Block;
    amenities: string[];
    cancellation_policy: string;
    guests_included:number;
    reviews: {
        number_of_reviews: number;
        number: number;
        numberPerMonth: number;
        rating: number;
        scores: {
            accuracy: number;
            cleanliness: number;
            checkin: number;
            communication: number;
            location: number;
            value: number;
        }
    };
    host_listings_count:number;
    prices: {
        markup_amount: number;
        markup_percentage: number;
        airbnb: {
            daily: number;
            monthly: number;
            monthly_per_bedroom: number;
        };
        trulia: {
            rent_per_bedroom: number;
        };
    }
}

export interface Neighborhood {
    name: Neighborhood.NameType;
    listings: Listing[];
}
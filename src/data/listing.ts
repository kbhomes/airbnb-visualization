import * as d3 from '../d3';

export module Listing {
    export type IDType = number;
    export function parseCSVRow(row: d3.DSVRowString, neighborhood: Neighborhood) : Listing {
        return {
            id: +row['id'],
            name: row['name'],
            description: row['description'],
            neighborhood: neighborhood,
            amenities: row['amenities'],
            cancellation_policy: row['cancellation_policy'],
            reviews: {
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
    amenities: string;
    cancellation_policy: string;
    reviews: {
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
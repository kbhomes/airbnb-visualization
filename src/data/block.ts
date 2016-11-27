import { Listing } from './listing';

export interface Block {
    type: "price" | "markup";
    number: number;
    minimum: number;
    maximum: number;
    listings: Listing[];
    listingsStartIndex?: number;
}

export module Block {
    export function contains(block: Block, listing: Listing) : boolean {
        let value = 0;
        
        if (block.type === "price") {
            value = listing.prices.airbnb.daily;
        }
        else {
            value = listing.prices.markup_percentage;
        }            

        return block.minimum <= value && (isNaN(block.maximum) || value < block.maximum);
    }

    export function value(block: Block, listing: Listing) : number {
        if (block.type === "price") {
            return listing.prices.airbnb.daily;
        }
        else {
            return listing.prices.markup_percentage;
        }
    }
}
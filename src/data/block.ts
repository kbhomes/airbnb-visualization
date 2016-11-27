import { Listing } from './listing';

export interface Block {
    type: "price" | "markup";
    minimum: number;
    maximum: number;
    listings: Listing[];
    listingsStartIndex?: number;
}
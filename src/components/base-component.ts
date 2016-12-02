import * as d3 from '../d3';
import * as dispatch from '../data/dispatch';
import { Neighborhood, Listing } from '../data/listing';
import { Block } from '../data/block';

export abstract class BaseComponent {
    protected element: Element;
    protected selector: string;
    protected dispatcher: dispatch.Dispatch;

    protected data: dispatch.LoadEventData;
    protected selection: dispatch.SelectEventData;
    protected highlight: dispatch.HighlightEventData;
    protected filter: dispatch.FilterEventData;

    public constructor(selector: string, dispatcher: dispatch.Dispatch) {
        this.element = document.querySelector(selector);
        this.selector = selector;
        this.dispatcher = dispatcher;

        // Set up dispatch listeners
        this.dispatcher.on(this.getComponentEventName(dispatch.DispatchEvent.Load), this.eventBind(this.onLoad));
        this.dispatcher.on(this.getComponentEventName(dispatch.DispatchEvent.Select), this.eventBind(this.onSelect));
        this.dispatcher.on(this.getComponentEventName(dispatch.DispatchEvent.Highlight), this.eventBind(this.onHighlight));
        this.dispatcher.on(this.getComponentEventName(dispatch.DispatchEvent.Filter), this.eventBind(this.onFilter));

        // Set up empty events
        this.selection = { neighborhoods: undefined, listings: undefined, priceBlocks: undefined, markupBlocks: undefined, amenities: undefined };
        this.highlight = { neighborhood: undefined, listing: undefined };
        this.filter = { filter: false };
    }

    private eventBind(handler: Function) {
        let self = this;

        return function(args: any) {
            // In this function, 'this' is the sender of the dispatch call
            handler.call(self, args);
        }
    }

    private getComponentName(): string {
        return this.constructor['name'];
    }

    private getComponentEventName(event: string) : string {
        return event + '.' + this.getComponentName();
    }

    protected dispatchListingHighlight(listing: Listing, highlight: boolean) {
        this.dispatcher.call(dispatch.DispatchEvent.Highlight, this, {
            neighborhood: undefined,
            listing: (highlight ? listing : undefined)
        } as dispatch.HighlightEventData);
    }

    protected dispatchNeighborhoodHighlight(neighborhood: Neighborhood, highlight: boolean) {
        this.dispatcher.call(dispatch.DispatchEvent.Highlight, this, {
            neighborhood: (highlight ? neighborhood : undefined),
            listing: undefined
        } as dispatch.HighlightEventData);
    }

    protected dispatchListingSelection(listing: Listing, newSelection: boolean) {
        if (newSelection) {
            this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                neighborhoods: undefined,
                listings: [listing],
                priceBlocks: undefined,
                markupBlocks: undefined,
                amenities: undefined
            } as dispatch.SelectEventData);
        }
        else {
            // Check whether to add or remove this listing from the selection
            if (this.selection.listings && this.selection.listings.indexOf(listing) !== -1) {
                // Listing is already selected, so send out a selection event with this deselected
                let selectedIndex = this.selection.listings.indexOf(listing);
                let selectedListings = this.selection.listings.slice();
                selectedListings.splice(selectedIndex, 1);

                if (selectedListings.length === 0)
                    selectedListings = undefined;

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                    neighborhoods: undefined,
                    listings: selectedListings,
                    priceBlocks: undefined,
                    markupBlocks: undefined,
                    amenities: undefined
                } as dispatch.SelectEventData);
            }
            else {
                // Listing is not already selected, so send out a selection event with this selected
                let selectedListings = (this.selection.listings || []).slice();
                selectedListings.push(listing);

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                    neighborhoods: undefined,
                    listings: selectedListings,
                    priceBlocks: undefined,
                    markupBlocks: undefined,
                    amenities: undefined
                } as dispatch.SelectEventData);
            }
        }
    }

    protected dispatchNeighborhoodSelection(neighborhood: Neighborhood, newSelection: boolean) {
        if (newSelection) {
            this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                neighborhoods: [neighborhood],
                listings: undefined,
                priceBlocks: undefined,
                markupBlocks: undefined,
                amenities: undefined
            } as dispatch.SelectEventData);
        }
        else {
            // Check whether to add or remove this neighborhood from the selection
            if (this.selection.neighborhoods && this.selection.neighborhoods.indexOf(neighborhood) !== -1) {
                // Neighborhood is already selected, so send out a selection event with this deselected
                let selectedIndex = this.selection.neighborhoods.indexOf(neighborhood);
                let selectedNeighborhoods = this.selection.neighborhoods.slice();
                selectedNeighborhoods.splice(selectedIndex, 1);

                if (selectedNeighborhoods.length === 0)
                    selectedNeighborhoods = undefined;

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                    neighborhoods: selectedNeighborhoods,
                    listings: undefined,
                    priceBlocks: undefined,
                    markupBlocks: undefined
                } as dispatch.SelectEventData);
            }
            else {
                // Neighborhood is not already selected, so send out a selection event with this selected
                let selectedNeighborhoods = (this.selection.neighborhoods || []).slice();
                selectedNeighborhoods.push(neighborhood);

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                    neighborhoods: selectedNeighborhoods,
                    listings: undefined,
                    priceBlocks: undefined,
                    markupBlocks: undefined
                } as dispatch.SelectEventData);
            }
        }
    }

    protected dispatchBlockSelection(block: Block, newSelection: boolean) {
        if (block.type === 'price') {
            if (newSelection) {
                this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                    neighborhoods: undefined,
                    listings: undefined,
                    priceBlocks: [block],
                    markupBlocks: undefined,
                    amenities: undefined
                } as dispatch.SelectEventData);
            }
            else {
                // Check whether to add or remove this price block from the selection
                if (this.selection.priceBlocks && this.selection.priceBlocks.indexOf(block) !== -1) {
                    // Block is already selected, so send out a selection event with this deselected
                    let selectedIndex = this.selection.priceBlocks.indexOf(block);
                    let selectedPriceBlocks = this.selection.priceBlocks.slice();
                    selectedPriceBlocks.splice(selectedIndex, 1);

                    if (selectedPriceBlocks.length === 0)
                        selectedPriceBlocks = undefined;

                    this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                        neighborhoods: undefined,
                        listings: undefined,
                        priceBlocks: selectedPriceBlocks,
                        markupBlocks: undefined
                    } as dispatch.SelectEventData);
                }
                else {
                    // Neighborhood is not already selected, so send out a selection event with this selected
                    let selectedPriceBlocks = (this.selection.priceBlocks || []).slice();
                    selectedPriceBlocks.push(block);

                    this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                        neighborhoods: undefined,
                        listings: undefined,
                        priceBlocks: selectedPriceBlocks,
                        markupBlocks: undefined
                    } as dispatch.SelectEventData);
                }
            }
        }
        else {
            if (newSelection) {
                this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                    neighborhoods: undefined,
                    listings: undefined,
                    priceBlocks: undefined,
                    markupBlocks: [block],
                    amenities: undefined
                } as dispatch.SelectEventData);
            }
            else {
                // Check whether to add or remove this markup block from the selection
                if (this.selection.markupBlocks && this.selection.markupBlocks.indexOf(block) !== -1) {
                    // Block is already selected, so send out a selection event with this deselected
                    let selectedIndex = this.selection.markupBlocks.indexOf(block);
                    let selectedMarkupBlocks = this.selection.markupBlocks.slice();
                    selectedMarkupBlocks.splice(selectedIndex, 1);

                    if (selectedMarkupBlocks.length === 0)
                        selectedMarkupBlocks = undefined;

                    this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                        neighborhoods: undefined,
                        listings: undefined,
                        priceBlocks: undefined,
                        markupBlocks: selectedMarkupBlocks
                    } as dispatch.SelectEventData);
                }
                else {
                    // Neighborhood is not already selected, so send out a selection event with this selected
                    let selectedMarkupBlocks = (this.selection.markupBlocks || []).slice();
                    selectedMarkupBlocks.push(block);

                    this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                        neighborhoods: undefined,
                        listings: undefined,
                        priceBlocks: undefined,
                        markupBlocks: selectedMarkupBlocks
                    } as dispatch.SelectEventData);
                }
            }
        }
    }

    protected dispatchAmenitySelection(amenity: string, newSelection: boolean) {
        if (newSelection) {
            this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                neighborhoods: undefined,
                listings: undefined,
                priceBlocks: undefined,
                markupBlocks: undefined,
                amenities: [amenity]
            } as dispatch.SelectEventData);
        }
        else {
            // Check whether to add or remove this amenity from the selection
            if (this.selection.amenities && this.selection.amenities.indexOf(amenity) !== -1) {
                // Amenity is already selected, so send out a selection event with this deselected
                let selectedIndex = this.selection.amenities.indexOf(amenity);
                let selectedAmenities = this.selection.amenities.slice();
                selectedAmenities.splice(selectedIndex, 1);

                if (selectedAmenities.length === 0)
                    selectedAmenities = undefined;

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                    neighborhoods: undefined,
                    listings: undefined,
                    priceBlocks: undefined,
                    markupBlocks: undefined,
                    amenities: selectedAmenities
                } as dispatch.SelectEventData);
            }
            else {
                // Amenity is not already selected, so send out a selection event with this selected
                let selectedAmenities = (this.selection.amenities || []).slice();
                selectedAmenities.push(amenity);

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, {
                    neighborhoods: undefined,
                    listings: undefined,
                    priceBlocks: undefined,
                    markupBlocks: undefined,
                    amenities: selectedAmenities
                } as dispatch.SelectEventData);
            }
        }
    }

    public onLoad(data: dispatch.LoadEventData) : void {
        this.data = data;
    }

       //computes the average neighborhood price
    public getNeighborhoodPriceAverage(neighborhood):number{

        let sum  = 0;


        if(neighborhood == undefined){
            return 0;
        }
        let neighborhood_listings = neighborhood.listings;

        for (var house in neighborhood_listings) {

            sum += (+neighborhood_listings[house]['prices']['airbnb']['daily']);
        }

        let average = sum/neighborhood_listings.length;

        return Math.round(average);
    }

    public onSelect(selection: dispatch.SelectEventData) : void {
        this.selection = selection;
    }

    public onHighlight(highlight: dispatch.HighlightEventData) : void {
        this.highlight = highlight;
    }
    
    public onFilter(filter: dispatch.FilterEventData) : void {
        this.filter = filter;
    }

    public abstract resize();
    public abstract render();
}
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

    protected allSelectedListings: Listing[];

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
        this.selection = dispatch.Dispatch.emptySelection();
        this.highlight = { neighborhood: undefined, listing: undefined };
        this.filter = dispatch.Dispatch.emptyFilter();

        this.allSelectedListings = [];
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

    private computeAllSelectedListings() {
        this.allSelectedListings = [];

        if (dispatch.Dispatch.isEmptySelection(this.selection)) {
            return;
        }

        for (let listing of Array.from(this.data.listings.values())) {
            // Don't add listings not in a selected neighborhood
            if (this.selection.neighborhoods.length) {
                if (this.selection.neighborhoods.indexOf(listing.neighborhood) === -1)
                    continue;
            }

            // Don't add listings not in the selected listings
            if (this.selection.listings.length) {
                if (this.selection.listings.indexOf(listing) === -1)
                    continue;
            }

            // Don't add listings not in a selected price block
            if (this.selection.priceBlocks.length) {
                if (this.selection.priceBlocks.indexOf(listing.priceBlock) === -1)
                    continue;
            }

            // Don't add listings not in a selected markup block
            if (this.selection.markupBlocks.length) {
                if (this.selection.markupBlocks.indexOf(listing.markupBlock) === -1)
                    continue;
            }

            // Don't add listings what don't have the selected amenities
            if (this.selection.amenities.length) {
                if (!this.selection.amenities.every(amenity => listing.amenities.indexOf(amenity) !== -1))
                    continue;
            }

            this.allSelectedListings.push(listing);
        }
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

    protected dispatchListingSelection(listing: Listing, createNewSelection: boolean) {
        if (createNewSelection) {
            let sel = dispatch.Dispatch.emptySelection();
            sel.listings.push(listing);

            this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
        }
        else {
            // Check whether to add or remove this listing from the selection
            if (this.selection.listings.indexOf(listing) !== -1) {
                // Listing is already selected, so send out a selection event with this deselected
                let sel = dispatch.Dispatch.cloneSelection(this.selection);
                let selectedIndex = sel.listings.indexOf(listing);
                sel.listings.splice(selectedIndex, 1);

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
            }
            else {
                // Listing is not already selected, so send out a selection event with this selected
                let sel = dispatch.Dispatch.cloneSelection(this.selection);
                sel.listings.push(listing);

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
            }
        }
    }

    protected dispatchNeighborhoodFilter(neighborhoods: Neighborhood[]) {
        let filter = dispatch.Dispatch.cloneFilter(this.filter);
        filter.neighborhoods = neighborhoods.slice();
        this.dispatcher.call(dispatch.DispatchEvent.Filter, this, filter);
    }

    protected dispatchNeighborhoodSelection(neighborhood: Neighborhood, createNewSelection: boolean) {
        if (createNewSelection) {
            let sel = dispatch.Dispatch.emptySelection();
            sel.neighborhoods.push(neighborhood);

            this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
        }
        else {
            // Check whether to add or remove this neighborhood from the selection
            if (this.selection.neighborhoods.indexOf(neighborhood) !== -1) {
                // Neighborhood is already selected, so send out a selection event with this deselected
                let sel = dispatch.Dispatch.cloneSelection(this.selection);
                let selectedIndex = sel.neighborhoods.indexOf(neighborhood);
                sel.neighborhoods.splice(selectedIndex, 1);
                
                this.dispatcher.call(dispatch.DispatchEvent.Select, this,sel);
            }
            else {
                // Neighborhood is not already selected, so send out a selection event with this selected
                let sel = dispatch.Dispatch.cloneSelection(this.selection);                
                sel.neighborhoods.push(neighborhood);

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
            }
        }
    }

    protected dispatchPriceBlockFilter(priceBlocks: Block[]) {
        let filter = dispatch.Dispatch.cloneFilter(this.filter);
        filter.priceBlocks = priceBlocks.slice();
        this.dispatcher.call(dispatch.DispatchEvent.Filter, this, filter);
    }

    protected dispatchBlockSelection(block: Block, createNewSelection: boolean) {
        if (block.type === 'price') {
            if (createNewSelection) {
                let sel = dispatch.Dispatch.emptySelection();
                sel.priceBlocks.push(block);

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
            }
            else {
                // Check whether to add or remove this price block from the selection
                if (this.selection.priceBlocks.indexOf(block) !== -1) {
                    // Block is already selected, so send out a selection event with this deselected
                    let sel = dispatch.Dispatch.cloneSelection(this.selection);
                    let selectedIndex = this.selection.priceBlocks.indexOf(block);
                    sel.priceBlocks.splice(selectedIndex, 1);
                    
                    this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
                }
                else {
                    // Price block is not already selected, so send out a selection event with this selected
                    let sel = dispatch.Dispatch.cloneSelection(this.selection);
                    sel.priceBlocks.push(block);

                    this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
                }
            }
        }
        else {
            if (createNewSelection) {
                let sel = dispatch.Dispatch.emptySelection();
                sel.markupBlocks.push(block);

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
            }
            else {
                // Check whether to add or remove this markup block from the selection
                if (this.selection.markupBlocks.indexOf(block) !== -1) {
                    // Block is already selected, so send out a selection event with this deselected
                    let sel = dispatch.Dispatch.cloneSelection(this.selection);
                    let selectedIndex = this.selection.markupBlocks.indexOf(block);
                    sel.markupBlocks.splice(selectedIndex, 1);
                    
                    this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
                }
                else {
                    // Markup block is not already selected, so send out a selection event with this selected
                    let sel = dispatch.Dispatch.cloneSelection(this.selection);
                    sel.markupBlocks.push(block);

                    this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
                }
            }
        }
    }

    protected dispatchMarkupBlockFilter(markupBlocks: Block[]) {
        let filter = dispatch.Dispatch.cloneFilter(this.filter);
        filter.markupBlocks = markupBlocks.slice();
        this.dispatcher.call(dispatch.DispatchEvent.Filter, this, filter);
    }

    protected dispatchAmenitySelection(amenity: string, createNewSelection: boolean) {
        if (createNewSelection) {
            let sel = dispatch.Dispatch.emptySelection();
            sel.amenities.push(amenity);

            this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
        }
        else {
            // Check whether to add or remove this amenity from the selection
            if (this.selection.amenities.indexOf(amenity) !== -1) {
                // Amenity is already selected, so send out a selection event with this deselected
                let sel = dispatch.Dispatch.cloneSelection(this.selection);
                let selectedIndex = this.selection.amenities.indexOf(amenity);
                sel.amenities.splice(selectedIndex, 1);

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
            }
            else {
                // Amenity is not already selected, so send out a selection event with this selected
                let sel = dispatch.Dispatch.cloneSelection(this.selection);
                sel.amenities.push(amenity);

                this.dispatcher.call(dispatch.DispatchEvent.Select, this, sel);
            }
        }
    }

    protected dispatchAmenityFilter(amenities: string[]) {
        let filter = dispatch.Dispatch.cloneFilter(this.filter);
        filter.amenities = amenities.slice();
        this.dispatcher.call(dispatch.DispatchEvent.Filter, this, filter);
    }

    public onLoad(data: dispatch.LoadEventData) : void {
        this.data = data;
    }

    public onSelect(selection: dispatch.SelectEventData) : void {
        this.selection = selection;
        this.computeAllSelectedListings();
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
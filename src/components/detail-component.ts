import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { NeighborhoodGeoJSON, NeighborhoodGeoJSONFeature } from '../data/geojson';
import { Attribute } from '../data/attribute';

export class DetailComponent extends BaseComponent {


    private view: {
        svg?: d3.Selection<d3.BaseType, {}, d3.BaseType, {}>;
        paths?: d3.Selection<d3.BaseType, NeighborhoodGeoJSONFeature, d3.BaseType, {}>;
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        
     
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);
        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);
        let price = d3.select('#price');
        let rating = d3.select('#rating');
        

        if(this.highlight.neighborhood != undefined){
            //get highlighted neighborhood
            let neighborhood = this.data.neighborhoods.get(this.highlight.neighborhood.name);
            
            //average_price
            let average_price = Attribute.price.neighborhoodAccessor(neighborhood)
            price.text(average_price).attr('fill','#ff1d23'); 

            //average_rating
            let average_rating = Math.round(Attribute.rating.neighborhoodAccessor(neighborhood));
            rating.text(average_rating).attr('fill','#ff1d23'); 
            
        }


        if(this.highlight.listing != undefined){
            //get highlighted neighborhood
            let listing = this.highlight.listing
            
            //listing price
            let listing_price = Attribute.price.accessor(listing)
            price.text(listing_price).attr('fill','#ff1d23'); 

            //listing rating
            let listing_rating = Math.round(Attribute.rating.accessor(listing));
            rating.text(listing_rating).attr('fill','#ff1d23'); 
        }

    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
    }

    public resize() {

    }



    public render() {
        let self = this;

      
    }
} 
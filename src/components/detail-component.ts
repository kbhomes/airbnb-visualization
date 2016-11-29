import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { NeighborhoodGeoJSON, NeighborhoodGeoJSONFeature } from '../data/geojson';
import { Listing, Neighborhood } from '../data/listing';
import { Attribute } from '../data/attribute';

export class DetailComponent extends BaseComponent {

        private price = d3.select('#price');
        private rating = d3.select('#rating');
        private numberOfListings = d3.select('#amount');
        private levelSelect = d3.select('.level-select');
        private selectedLevel: 'Neighborhoods' | 'Listings';
        private totalNumberOfSelectedListings = 0.0
        private totalNumberOfSelectedRatings = 0.0
        private totalNumberOfSelectedPrices = 0.0
        
        

    private view: {
        svg?: d3.Selection<d3.BaseType, {}, d3.BaseType, {}>;
        paths?: d3.Selection<d3.BaseType, NeighborhoodGeoJSONFeature, d3.BaseType, {}>;
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

         this.selectedLevel = 'Neighborhoods';
     
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);
        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
        let neighborhoods = selection.neighborhoods
        this.averageOfSelectedNeighborhoodPrices(neighborhoods);
        this.averageOfSelectedNeighborhoodRatings(neighborhoods);
        this.totalNumberOfListings(neighborhoods);
    }

    public averageOfSelectedNeighborhoodPrices(neighborhoods:Neighborhood[]){

        var counter = 0.0

        if(neighborhoods == undefined){
            return;
        }

        for(var hood in neighborhoods){
            let neighborhood =  neighborhoods[hood]
            counter += Attribute.price.neighborhoodAccessor(neighborhood); 
        }
        
        this.totalNumberOfSelectedPrices = counter

        let average = Math.round(counter/neighborhoods.length);

         this.price.text(average).attr('fill','#ff1d23')
    }

    public averageOfSelectedNeighborhoodRatings(neighborhoods:Neighborhood[]):number{

         var counter = 0.0

        if(neighborhoods == undefined){
            return;
        }

        for(var hood in neighborhoods){
            let neighborhood =  neighborhoods[hood]
            let rating = Attribute.rating.neighborhoodAccessor(neighborhood); 
            if(!isNaN(rating)){
                counter += rating
            }
        }

        this.totalNumberOfSelectedRatings = counter;

        let average = Math.round(this.totalNumberOfSelectedRatings/neighborhoods.length);

         this.rating.text(average).attr('fill','#ff1d23')

    }

    public totalNumberOfListings(neighborhoods:Neighborhood[]){

        var counter = 0.0
        
        if(neighborhoods == undefined){
            return;
        }

        for(var hood in neighborhoods){
            let neighborhood =  neighborhoods[hood]
             counter += neighborhood.listings.length
            
        }

            this.totalNumberOfSelectedListings = counter

            this.numberOfListings.text(counter).attr('fill','#ff1d23');

    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);

        let selectedNeighborhoods = this.selection.neighborhoods
        let highlightedNeighborhood = this.highlight.neighborhood
        let highlightedListing = this.highlight.listing

        if(highlightedNeighborhood != undefined){
            //get highlighted neighborhood
            let neighborhood = this.data.neighborhoods.get(this.highlight.neighborhood.name);
            
            //number of listings
            let number_of_listings = neighborhood.listings.length
            this.numberOfListings.text(number_of_listings).attr('fill','#ff1d23');

            //average_price
            let average_price = Attribute.price.neighborhoodAccessor(neighborhood)
            this.price.text(average_price).attr('fill','#ff1d23'); 

            //average_rating
            let average_rating = Math.round(Attribute.rating.neighborhoodAccessor(neighborhood));
            this.rating.text(average_rating).attr('fill','#ff1d23'); 
            
        }


        if(this.highlight.listing != undefined){
            //get highlighted case
            let listing = this.highlight.listing

            //number of listings message
            numberOfListings.text("Select neighborhood to view").attr('fill','#ff1d23');

            
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
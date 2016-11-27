import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { Listing, Neighborhood } from '../data/listing';
import { Block } from '../data/block';

export class ListingBlocksComponent extends BaseComponent {
    
    private view: {
        svg?: d3.Selection<d3.BaseType, {}, d3.BaseType, {}>;
        priceBlockGroups?: d3.Selection<d3.BaseType, Block, d3.BaseType, {}>;
        markupBlockGroups?: d3.Selection<d3.BaseType, Block, d3.BaseType, {}>;
    }

    private priceBlocks: Block[];
    private markupBlocks: Block[];

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        // Initialize our canvas
        let width = this.element.clientWidth;
        let height = this.element.clientHeight;

        this.priceBlocks = [];
        this.markupBlocks = [];

        this.view = {};
        this.view.svg = d3.select(this.selector).append('svg')
            .attr('class', 'chart')
            .attr('width', width)
            .attr('height', height);
    }

    private initializeBlocks() {
        // Initialize the price block ranges
        let ranges = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000];

        for (let i = 0; i < ranges.length; i++) {
            this.priceBlocks.push({
                type: "price",
                minimum: ranges[i],
                maximum: (i === ranges.length - 1) ? NaN : ranges[i+1],
                listings: []
            });
        }

        // Initialize the blocks for the listings
        for (let listing of Array.from(this.data.listings.values())) {
            let price = listing.prices.airbnb.daily;

            // Find the right price block for this listing
            for (let block of this.priceBlocks) {
                if (block.minimum <= price && (isNaN(block.maximum) || price < block.maximum)) {
                    block.listings.push(listing);
                    continue;
                }
            }
        }

        // Update the price blocks with information about where they start relative to one another
        this.priceBlocks.reduce((accumulator, block) => {
            block.listingsStartIndex = accumulator;
            return accumulator + block.listings.length;
        }, 0);
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);
        
        this.initializeBlocks();
        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
        this.render();
    }

    public resize() {

    }

    public render() {
        let self = this;

        let padding = 5;
        let sectionLabelWidth = 100;
        let width = this.element.clientWidth - sectionLabelWidth;
        let height = this.element.clientHeight;

        let blockHeight = height / 3;
        let blockWidth = (block: Block) => {
            return Math.max(width * block.listings.length / this.data.listings.size - padding, 1);
        };
        let blockX = (block: Block) => {
            return sectionLabelWidth + padding + width * block.listingsStartIndex / this.data.listings.size;
        };
        let blockLabel = (block: Block) => {
            let label = '$' + block.minimum.toFixed(0);
            if (isNaN(block.maximum))
                label += '+';
            return label;
        };

        let priceBlocksSelection = this.view.svg
          .selectAll('g.price-block')
            .data(this.priceBlocks);

        let priceBlocksEnter = priceBlocksSelection.enter().append('g').attr('class', 'price-block');
        priceBlocksEnter.append('rect').attr('class', 'block-rect');
        priceBlocksEnter.append('text').attr('class', 'block-label');

        this.view.priceBlockGroups = priceBlocksSelection.merge(priceBlocksEnter);
        this.view.priceBlockGroups.style('transform', d => `translate(${blockX(d)}px, 0)`);
        this.view.priceBlockGroups
          .select('rect.block-rect')
            .attr('height', blockHeight)
            .attr('width', blockWidth)
            .attr('y', height/6)
            .style('fill', '#e8e8e8')
            .style('stroke', 'black')
            .style('stroke-width', 1);
        this.view.priceBlockGroups
          .select('text.block-label')
            .attr('x', d => blockWidth(d) / 2)
            .attr('y', height/12)
            .text(blockLabel)
            .style('text-anchor', 'middle')
            .style('font-size', '10px');
    }
} 
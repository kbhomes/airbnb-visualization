import * as d3 from '../d3';

import { BaseComponent } from './base-component';
import { Dispatch, DispatchEvent, LoadEventData, SelectEventData, HighlightEventData, FilterEventData } from '../data/dispatch';
import { Listing, Neighborhood } from '../data/listing';
import { Block } from '../data/block';

export class ListingBlocksComponent extends BaseComponent {
    
    private view: {
        svg?: d3.DatalessSelection;
        priceBlockGroups?: d3.DataSelection<Block>;
        markupBlockGroups?: d3.DataSelection<Block>;

        priceColorScale?: d3.ScaleLinear<string, string>;
        markupColorScale?: d3.ScaleLinear<string, string>;
    }

    public constructor(selector: string, dispatcher: Dispatch) {
        super(selector, dispatcher);

        // Initialize our canvas
        let width = this.element.clientWidth;
        let height = this.element.clientHeight;

        this.view = {};
        this.view.svg = d3.select(this.selector).append('svg')
            .attr('class', 'chart')
            .attr('width', width)
            .attr('height', height);

        this.view.priceColorScale = d3.scaleLinear<string>().range(['#edf8fb', '#386fa4']);
        this.view.markupColorScale = d3.scaleLinear<string>().range(['#edf8fb', '#386fa4']);
    }

    private interpolateRed(t: number) : string {
        return d3.hsl(0.0, 1.0, 1.0 - t/2) + '';
    }

    public onLoad(data: LoadEventData) {
        super.onLoad(data);
        this.render();
    }

    public onSelect(selection: SelectEventData) {
        super.onSelect(selection);
        this.updateColors();
        this.updateListings();
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);
        this.updateColors();
        this.updateListings();
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
        this.updateColors();
        this.updateListings();
    }

    public resize() {

    }

    private isBlockEnabled(block: Block) {
        if (block.type === 'price' && this.filter.priceBlocks.length && this.filter.priceBlocks.indexOf(block) === -1) {
            return false;
        }
        else if (block.type === 'markup' && this.filter.markupBlocks.length && this.filter.markupBlocks.indexOf(block) === -1) {
            return false;
        }

        return true;
    }

    private updateListings() {
        // If any price blocks are selected, draw those listings
        let selectedPriceBlocks = this.selection.priceBlocks || [];
        let selectedMarkupBlocks = this.selection.markupBlocks || [];

        let allPriceBlocks = (this.filter.priceBlocks.length) ? this.filter.priceBlocks : this.data.priceBlocks;
        let allMarkupBlocks = (this.filter.markupBlocks.length) ? this.filter.markupBlocks : this.data.markupBlocks;

        if (selectedPriceBlocks.length !== 0 || selectedMarkupBlocks.length !== 0) {
            for (let block of allPriceBlocks) {
                if (selectedPriceBlocks.indexOf(block) !== -1) {
                    this.drawListingsWithinBlock(block);
                }
                else {
                    this.hideListingsWithinBlock(block);
                }
            }

            for (let block of allMarkupBlocks) {
                if (selectedMarkupBlocks.indexOf(block) !== -1) {
                    this.drawListingsWithinBlock(block);
                }
                else {
                    this.hideListingsWithinBlock(block);
                }
            }
        }
        // // If only a single listing is selected or highlighted, show them individually in the blocks
        // else if (this.selection.listings && this.selection.listings.length === 1) {
        //     let listing = this.selection.listings[0];
        //     this.drawListingsWithinBlock(listing.priceBlock, listing);
        //     this.drawListingsWithinBlock(listing.markupBlock, listing);
        //     this.hideListingsWithinAllOtherBlocks(listing.priceBlock);
        //     this.hideListingsWithinAllOtherBlocks(listing.markupBlock);
        // }
        // else if (this.highlight.listing) {
        //     let listing = this.highlight.listing;
        //     this.drawListingsWithinBlock(listing.priceBlock, listing);
        //     this.drawListingsWithinBlock(listing.markupBlock, listing);
        //     this.hideListingsWithinAllOtherBlocks(listing.priceBlock);
        //     this.hideListingsWithinAllOtherBlocks(listing.markupBlock);
        // }
        else {
            this.hideListingsWithinAllBlocks();
        }
    }

    private updateColors() {
        let priceCounts = Array<number>(this.data.priceBlocks.length).fill(0);
        let markupCounts = Array<number>(this.data.markupBlocks.length).fill(0);

        let displayedListings = this.allSelectedListings;

        if (this.allSelectedListings.length === 0 && Dispatch.isEmptySelection(this.selection)) {
            if (this.highlight.neighborhood)
                displayedListings = this.highlight.neighborhood.listings;
        }

        // Update the counts for our given listings
        for (let listing of displayedListings) {
            priceCounts[listing.priceBlock.number] += 1;
            markupCounts[listing.markupBlock.number] += 1;
        }

        // Create the fill color function
        let blockFill = (block: Block) => {
            if (!this.isBlockEnabled(block)) {
                return 'grey';
            }
            else if (displayedListings.length === 0) {
                return 'white';
            }
            else {
                if (block.type === 'price') {
                    if (this.selection.priceBlocks.length) {
                        return 'white';
                    }
                    else {
                        return this.view.priceColorScale(priceCounts[block.number]);
                    }
                } 
                else {
                    if (this.selection.markupBlocks.length) {
                        return 'white';
                    }
                    else {
                        return this.view.markupColorScale(markupCounts[block.number]);
                    }
                }
            }
        }

        // Highlight the neighborhoods in the blocks
        this.view.priceColorScale.domain(d3.extent(priceCounts));
        this.view.markupColorScale.domain(d3.extent(markupCounts));

        this.view.priceBlockGroups
            .transition().duration(500)
            .select('rect.block-rect')
            .attr('fill', blockFill);

        this.view.markupBlockGroups
            .transition().duration(500)
            .select('rect.block-rect')
            .attr('fill', blockFill);
    }

    private hideListingsWithinBlock(block: Block) {
        let allGroups = (block.type === 'price') ? this.view.priceBlockGroups : this.view.markupBlockGroups;
        allGroups.filter(d => d.number === block.number)
          .selectAll('rect.listing-bar')
            .attr('pointer-events', 'none')
          .transition().duration(200)
            .attr('opacity', 0)
    }

    private hideListingsWithinAllOtherBlocks(block: Block) {
        let allBlocks: Block[];
        
        if (block.type === 'price') {
            allBlocks = (this.filter.priceBlocks.length) ? this.filter.priceBlocks : this.data.priceBlocks;
        } 
        else {
            allBlocks = (this.filter.markupBlocks.length) ? this.filter.markupBlocks : this.data.markupBlocks;
        }
        
        for (let other of allBlocks) {
            if (block !== other)
                this.hideListingsWithinBlock(other);
        }
    }

    private hideListingsWithinAllBlocks() {
        let priceBlocks = (this.filter.priceBlocks.length) ? this.filter.priceBlocks : this.data.priceBlocks;
        let markupBlocks = (this.filter.markupBlocks.length) ? this.filter.markupBlocks : this.data.markupBlocks;

        for (let block of priceBlocks)
            this.hideListingsWithinBlock(block);

        for (let block of markupBlocks) 
            this.hideListingsWithinBlock(block);
    }

    private drawListingsWithinBlock(block: Block, highlightedListing?: Listing) {
        if (!this.isBlockEnabled(block))
            return;

        let thisGroups = (block.type === 'price') ? this.view.priceBlockGroups : this.view.markupBlockGroups;
        let otherGroups = (block.type === 'price') ? this.view.markupBlockGroups : this.view.priceBlockGroups;

        let thisKey = (block.type === 'price') ? 'priceBlock' : 'markupBlock';
        let otherBlockKey = (block.type === 'price') ? 'markupBlock' : 'priceBlock';

        let blockGroup = thisGroups.filter(d => d.number === block.number);
        let blockRect = blockGroup.select('rect.block-rect');

        let height = parseFloat(blockRect.attr('height'));
        let width = parseFloat(blockRect.attr('width'));
        let x = parseFloat(blockRect.attr('x'));
        let y = parseFloat(blockRect.attr('y'));

        // Create the height scale for this block
        let minimum = block.minimum;
        let maximum = isNaN(block.maximum) ? d3.max(block.listings, l => Block.value(block, l)) : block.maximum;
        let scaleHeight = d3.scaleLinear()
            .domain([minimum, maximum])
            .range([height * 0.1, height]);
        let barWidth = width / block.listings.length;

        let barFill = (listing: Listing, highlight: Listing) => {
            if (this.filteredListings.indexOf(listing) === -1)
                return 'white';
            
            if (listing === highlight)
                return 'red';
                
            return '#ccc';
        };

        let debouncedUpdateColor = (() => {
            let timeout = 0;
            let wait = 100;
            let self = this;

            return function(cancel = false) {
                clearTimeout(timeout);

                if (!cancel)
                    timeout = setTimeout(() => self.updateColors(), wait);
            };
        })();

        let listingBarsSelection = blockGroup
          .selectAll('rect.listing-bar')
            .data(block.listings);
        
        let listingBarsEnter = listingBarsSelection.enter()
          .append('rect')
            .attr('class', 'listing-bar')
            .attr('fill', d => barFill(d, highlightedListing))
            .attr('width', barWidth)
            .attr('x', (d,i) => i * barWidth)
            .attr('height', d => scaleHeight(Block.value(block, d)))
            .attr('y', d => y + (height - scaleHeight(Block.value(block, d))))
            .on('mouseenter', l => {
                otherGroups.selectAll('rect.listing-bar').attr('fill', (d:Listing) => barFill(d, l)); 
                this.drawListingsWithinBlock(l[otherBlockKey], l);
                debouncedUpdateColor(true);

                thisGroups
                    .filter(d => this.isBlockEnabled(d))
                    .selectAll('rect.listing-bar')
                    .attr('fill', (d:Listing) => barFill(d, l));

                otherGroups
                    .filter(d => this.isBlockEnabled(d))
                    .selectAll('rect.block-rect')
                    .attr('fill', 'white');
            })
            .on('mouseleave', l => {
                thisGroups
                    .filter(d => this.isBlockEnabled(d))
                    .selectAll('rect.listing-bar')
                    .attr('fill', (d:Listing) => barFill(d, undefined)); 

                this.hideListingsWithinBlock(l[otherBlockKey]);
                debouncedUpdateColor();
            });

        let listingBarsUpdate = listingBarsSelection.merge(listingBarsEnter);
        listingBarsUpdate
            .attr('pointer-events', 'auto')
          .transition().duration(200)
            .attr('opacity', 1)
            .attr('fill', d => barFill(d, highlightedListing));
    }

    public render() {
        let self = this;

        let padding = 5;
        let sectionLabelWidth = 50;
        let width = this.element.clientWidth - sectionLabelWidth;
        let height = this.element.clientHeight;

        let priceBlockSectionLabel = this.view.svg.select('text.price-block-label');
        if (priceBlockSectionLabel.empty()) {
            priceBlockSectionLabel = this.view.svg.append('text')
                .attr('class', 'price-block-label')
                .style('font-size', '10px')
                .text('Price:');
        }
        priceBlockSectionLabel
            .attr('x', padding)
            .attr('y', height/6 + height/6);

        let markupBlockSectionLabel = this.view.svg.select('text.markup-block-label');
        if (markupBlockSectionLabel.empty()) {
            markupBlockSectionLabel = this.view.svg.append('text')
                .attr('class', 'markup-block-label')
                .style('font-size', '10px')
                .text('Markup:');
        }
        markupBlockSectionLabel
            .attr('x', padding)
            .attr('y', height/2 + height/6 + padding);

        let blockHeight = height / 3;
        let blockWidth = (block: Block) => {
            return Math.max(width * block.listings.length / this.data.listings.size - padding, 1);
        };
        let blockX = (block: Block) => {
            return sectionLabelWidth + padding + width * block.listingsStartIndex / this.data.listings.size;
        };
        let blockLabel = (block: Block) => {
            let label = block.minimum.toFixed(0);
            if (isNaN(block.maximum))
                label += '+';

            if (block.type === 'price') {
                label = '$' + label;
            }
            else {
                label += '%';
            }

            return label;
        };

        let priceBlocksSelection = this.view.svg
          .selectAll('g.price-block')
            .data(this.data.priceBlocks);

        let priceBlocksEnter = priceBlocksSelection.enter().append('g').attr('class', 'price-block');
        priceBlocksEnter.append('text').attr('class', 'block-label');
        priceBlocksEnter
          .append('rect')
            .attr('class', 'block-rect')
            .on('click', d => {
                if (this.isBlockEnabled(d))
                    this.dispatchBlockSelection(d, !d3.event.shiftKey)
            });

        this.view.priceBlockGroups = priceBlocksSelection.merge(priceBlocksEnter);
        this.view.priceBlockGroups.style('transform', d => `translate(${blockX(d)}px, ${-padding}px)`);
        this.view.priceBlockGroups
          .select('rect.block-rect')
            .attr('height', blockHeight)
            .attr('width', blockWidth)
            .attr('y', height/6)
            .attr('fill', 'white')
            .style('stroke', '#888')
            .style('stroke-width', 1);
        this.view.priceBlockGroups
          .select('text.block-label')
            .attr('x', d => blockWidth(d) / 2)
            .attr('y', height/12 + height/24)
            .text(blockLabel)
            .style('text-anchor', 'middle')
            .style('font-size', '10px');


        let markupBlocksSelection = this.view.svg
          .selectAll('g.markup-block')
            .data(this.data.markupBlocks);

        let markupBlocksEnter = markupBlocksSelection.enter().append('g').attr('class', 'markup-block');
        markupBlocksEnter.append('text').attr('class', 'block-label');
        markupBlocksEnter.append('rect')
            .attr('class', 'block-rect')
            .on('click', d => {
                if (this.isBlockEnabled(d))
                    this.dispatchBlockSelection(d, !d3.event.shiftKey)
            });

        this.view.markupBlockGroups = markupBlocksSelection.merge(markupBlocksEnter);
        this.view.markupBlockGroups.style('transform', d => `translate(${blockX(d)}px, ${padding + height/2}px)`);
        this.view.markupBlockGroups
          .select('rect.block-rect')
            .attr('height', blockHeight)
            .attr('width', blockWidth)
            .attr('y', 0)
            .attr('fill', 'white')
            .style('stroke', '#888')
            .style('stroke-width', 1);
        this.view.markupBlockGroups
          .select('text.block-label')
            .attr('x', d => blockWidth(d) / 2)
            .attr('y', height/2 - height/12)
            .text(blockLabel)
            .style('text-anchor', 'middle')
            .style('font-size', '10px');
    }
} 
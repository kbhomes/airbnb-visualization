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

        priceColorScale?: d3.ScaleSequential<string>;
        markupColorScale?: d3.ScaleSequential<string>;
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

        this.view.priceColorScale = d3.scaleSequential(this.interpolateRed);
        this.view.markupColorScale = d3.scaleSequential(this.interpolateRed);
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
    }

    public onHighlight(highlight: HighlightEventData) {
        super.onHighlight(highlight);
        this.updateColors();
    }

    public onFilter(filter: FilterEventData) {
        super.onFilter(filter);
        this.render();
    }

    public resize() {

    }

    private updateColors() {
        let priceCounts = Array<number>(this.data.priceBlocks.length).fill(0);
        let markupCounts = Array<number>(this.data.markupBlocks.length).fill(0);
        let neighborhoods = this.selection.neighborhoods || [];

        if (neighborhoods.length === 0 && this.highlight.neighborhood) {
            neighborhoods = [this.highlight.neighborhood];
        }

        // Loop through each listing in the neighborhoods and find the block it belongs to
        for (let neighborhood of neighborhoods) {
            for (let listing of neighborhood.listings) {
                priceCounts[listing.priceBlock.number] += 1;
                markupCounts[listing.markupBlock.number] += 1;
            }
        }

        // Create the fill color function
        let blockFill = (block: Block) => {
            if (neighborhoods.length === 0)
                return 'white';
            else {
                if (block.type === 'price') {
                    return this.view.priceColorScale(priceCounts[block.number]);
                } 
                else {
                    return this.view.markupColorScale(markupCounts[block.number]);
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
        priceBlocksEnter.append('rect').attr('class', 'block-rect');
        priceBlocksEnter.append('text').attr('class', 'block-label');

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
        markupBlocksEnter.append('rect').attr('class', 'block-rect');
        markupBlocksEnter.append('text').attr('class', 'block-label');

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
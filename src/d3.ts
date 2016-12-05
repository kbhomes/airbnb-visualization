export * from 'd3-array';
export * from 'd3-axis';
export * from 'd3-collection';
export * from 'd3-color';
export * from 'd3-dispatch';
export * from 'd3-drag';
export * from 'd3-dsv';
export * from 'd3-ease';
export * from 'd3-format';
export * from 'd3-geo';
export * from 'd3-interpolate';
export * from 'd3-shape';
export * from 'd3-path';
export * from 'd3-queue';
export * from 'd3-random';
export * from 'd3-request';
export * from 'd3-scale';
export * from 'd3-scale-chromatic';
export * from 'd3-selection';
export * from 'd3-time';
export * from 'd3-timer';
export * from 'd3-transition';
export * from 'd3-zoom';

import * as d3Selection from 'd3-selection';
import * as d3Axis from 'd3-axis';

/* 
 * Extension to D3 to facilitate re-ordering elements
 */
d3Selection.selection.prototype.moveToFront = function() {  
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };

d3Selection.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
};

export type DataSelection<Datum> = d3Selection.Selection<d3Selection.BaseType, Datum, d3Selection.BaseType, {}>;
export type DatalessSelection = DataSelection<{}>; 

export interface GenericScale<Domain, Range> {
    (x: Domain): Range;
    domain(): Array<Domain>;
    range(): Array<number>;
    copy(): this;
    bandwidth?(): number;
    ticks?(count: number | d3Axis.AxisTimeInterval): Array<number> | Array<Date>;
    tickFormat?(count: number | d3Axis.AxisTimeInterval, specifier?: string): ((d: number) => string) | ((d: Date) => string);

    domain(domain: Array<Domain | { valueOf(): Domain }>): this;
    range(range: Array<Range>): this;
    padding?(padding: number): this;
}

export class Padding {
    public top: number;
    public bottom: number;
    public left: number;
    public right: number;

    public constructor();
    public constructor(amount: number);
    public constructor(topleft: number, bottomright: number);
    public constructor(top: number, bottom: number, left: number, right: number);
    public constructor(a?: number, b?: number, c?: number, d?: number) {
        if (a === undefined) {
            this.top = this.bottom = this.left = this.right = 0;
        }
        else if (b === undefined) {
            this.top = this.bottom = this.left = this.right = a;
        }
        else if (c === undefined) {
            this.top = this.bottom = a;
            this.left = this.right = b;
        }
        else {
            this.top = a;
            this.bottom = b;
            this.left = c;
            this.right = d;
        }
    }

    public centerX(width: number) : number {
        return this.left + this.width(width)/2;
    }

    public centerY(height: number) : number {
        return this.top + this.height(height)/2;
    }

    public width(width: number) : number {
        return width - this.left - this.right;
    }

    public height(height: number) : number {
        return height - this.top - this.bottom;
    }

    public translate(x: number, y: number) : string {
        return `translate(${this.left + x}px, ${this.top + y}px)`;
    }

    public translateX(x: number) : string {
        return `translate(${this.left + x}px, 0)`;
    }

    public translateY(y: number) : string {
        return `translate(0, ${this.top + y}px)`;
    }

    public static add(a: Padding, b: Padding) : Padding {
        return new Padding(a.top + b.top, a.bottom + b.bottom, a.left + b.left, a.right + b.right);
    }
}
export * from 'd3-array';
export * from 'd3-axis';
export * from 'd3-collection';
export * from 'd3-color';
export * from 'd3-dispatch';
export * from 'd3-dsv';
export * from 'd3-ease';
export * from 'd3-format';
export * from 'd3-geo';
export * from 'd3-interpolate';
export * from 'd3-path';
export * from 'd3-queue';
export * from 'd3-random';
export * from 'd3-request';
export * from 'd3-scale';
export * from 'd3-selection';
export * from 'd3-time';
export * from 'd3-timer';
export * from 'd3-transition';

import * as d3Selection from 'd3-selection';

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
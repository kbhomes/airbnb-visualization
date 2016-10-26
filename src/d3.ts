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

// Extension to D3 to facilitate re-ordering elements
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

// declare module d3 {
//     interface Selection {
//         moveToFront() : Selection;
//         moveToBack() : Selection;
//     }
// }

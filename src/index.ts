/// <reference path='d3.d.ts' />

// Based on bar chart tutorial
// https://bost.ocks.org/mike/bar/

// Configure our visualization
let width = 420;
let barHeight = 20;
let data = [4, 8, 15, 16, 23, 42];

let chart = d3.select('.chart')
    .attr('width', width)
    .attr('height', data.length * barHeight);

// Create the x-axis's scale
let x = d3.scaleLinear()
    .range([0, width])
    .domain([0, d3.max(data)]);

// Create our data join
let bar = chart.selectAll('g').data(data);

let barEnter = bar.enter()
  .append('g')
    .attr('transform', (d, i) => 'translate(0,' + i * barHeight + ')');

barEnter.append('rect')
    .attr('width', d => x(d))
    .attr('height', barHeight - 1);
    
barEnter.append('text')
    .attr('x', d => x(d) - 3)
    .attr('y', barHeight / 2)
    .attr('dy', '.35em')
    .text(d => '' + d);
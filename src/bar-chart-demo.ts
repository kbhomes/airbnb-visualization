/// <reference path='d3.d.ts' />

export function barChartDemo() {
    // Based on bar chart tutorial
    // https://bost.ocks.org/mike/bar/

    // Configure our visualization
    let width = 420;
    let barHeight = 20;
    let data = [4, 8, 15, 16, 23, 42];

    let generator = d3.randomUniform(10, 100);

    let chart = d3.select('.chart')
        .attr('width', width)
        .attr('height', data.length * barHeight);

    // Create the x-axis's scale
    let x = d3.scaleLinear()
        .range([0, width])
        .domain([0, 100]);

    function drawBars() {
        // Create our data join
        let bar = chart.selectAll('g').data(data);

        // Create the bars for the entering elements
        let barEnter = bar.enter()
        .append('g')
            .attr('transform', (d, i) => 'translate(0,' + i * barHeight + ')');

        barEnter.append('rect')
            .attr('fill', 'steelblue')
            .attr('height', barHeight - 1);
            
        barEnter.append('text')
            .attr('y', barHeight / 2)
            .attr('dy', '.35em');

        barEnter.on('mouseenter', function() {
                d3.select(this)
                    .select('rect')
                    .attr('fill', 'red');
            })
            .on('mouseleave', function() {
                d3.select(this)
                    .select('rect')
                    .attr('fill', 'steelblue');
            });

        // Update all the bars
        let barUpdate = barEnter.merge(bar);
        let barTransition = barUpdate.transition();

        barUpdate.select('rect')
            .transition(barTransition)
            .attr('width', d => x(d));

        barUpdate.select('text')
            .transition(barTransition)
            .text(d => '' + d)
            .attr('x', d => x(d) - 3)
    }

    function generateRandomData() {
        // Generate random values for data
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.floor(generator());
        }

        // Redraw our bar chart
        drawBars();
    }

    drawBars();
    d3.interval(generateRandomData, 1500);
};
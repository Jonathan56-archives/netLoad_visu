// Size of the main container with magins
var margin = {top: 30, right: 50, bottom: 70, left: 40},
    width = parseInt(d3.select('#mainContainer').style('width')) - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// Scale to place the dimensions
var x = d3.scale.ordinal().rangePoints([0, width], 1);
// Scale for each of the dimensions
var  y = {};
// Line 
var line = d3.svg.line();
// Dimension axis
var axis = d3.svg.axis().orient("left");
// Variable holding a subgroup of lines in gray
var background;
// Variable holding a subgroup of lines in color
var foreground;
// Color scale
var color = d3.scale.category20();

// Add a SVG which will contain the parallel coordinates
var svg = d3.select("#chartContainer1").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

///////////////////////////////////////////////////////////////
var count = 0
var finalColor = d3.scale.category10();
var loadCurve = [];
var genCurve = [];

// a parser for the date
var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;
var colorLoad = d3.scale.category20();
var colorGen = d3.scale.category20();

// a scale for the time
var xLoadGen = d3.time.scale().nice().range([0, width])
.domain([parseDate('2015-01-01 00:00:00'), parseDate('2015-01-31 23:00:00')]);

//a scale for load y axis
var minLoad = 999999999999;
var maxLoad = -100;
var loadScale = d3.scale.linear().range([height, 0]);

//a scale for genenation y axis
var minGen = 999999999999;
var maxGen = -100;
var genScale = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().ticks(10).scale(xLoadGen) 
    .orient("bottom");

// the proper y axis based on the scale
var yAxis1 = d3.svg.axis().ticks(5).scale(loadScale)
    .orient("left");

var yAxis2 = d3.svg.axis().ticks(5).scale(genScale)
    .orient("left");

var lineLoad = d3.svg.line()
    .interpolate("basis")
    .x(function(d) { return xLoadGen(d.time); })
    .y(function(d) { return loadScale(d.data); });
var lineGen = d3.svg.line()
    .interpolate("basis")
    .x(function(d) { return xLoadGen(d.time); })
    .y(function(d) { return genScale(d.data); });

// Create a brush to zoom in on the graph
var brushLoadGen = d3.svg.brush()
    .x(xLoadGen)
    .on("brushend", brushend);

// Add an SVG for the load historical data
var svgLoad = d3.select("#load").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svgLoad.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svgLoad.append("g")
    .attr("class", "yLoad")
    .call(yAxis1)
    .append("g")
    .attr("transform", "translate(-60, -10)")
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Power (MW)");

// Append the brush
svgLoad.append("g")
    .attr("class", "brush2")
    .call(brushLoadGen)
  .selectAll('rect')
    .attr('height', height);

// append clip path for lines plotted, hiding those part out of bounds
svgLoad.append("defs")
    .append("clipPath") 
    .attr("id", "clipLoad")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

// Add an SVG for the generation historical data
var svgGen = d3.select("#gen").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svgGen.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svgGen.append("g")
    .attr("class", "yGen")
    .call(yAxis2)
    .append("g")
    .attr("transform", "translate(-60, -10)")
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Power (MW)");

// Append the brush
svgGen.append("g")
    .attr("class", "brush1")
    .call(brushLoadGen)
  .selectAll('rect')
    .attr('height', height);

// append clip path for lines plotted, hiding those part out of bounds
svgGen.append("defs")
    .append("clipPath") 
    .attr("id", "clipGen")
    .append("rect")
    .attr("width", width)
    .attr("height", height);
///////////////////////////////////////////////////////////////

// Load the data
d3.csv("parallel.csv", function(error, data) {

  // Creating a new variable to hold the visibility status and colors
  data.forEach(function(d, i) { 
    d.visible = true;
    d.color = color(i);
   });

  // Extract the list of dimensions and create a scale for each.
  x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
    // Avoid dimensions with the following names
    return d != "visible" && d != "color" && (y[d] = d3.scale.linear()
    // Get the min and max to scale the domain
        .domain(d3.extent(data, function(p) { return +p[d]; }))
        .range([height, 0]));
  }));

  // Add grey background lines for context.
  background = svg.append("g")
      .attr("class", "background")
    .selectAll("path")
      .data(data)
    .enter().append("path")
      .attr("d", path);

  // Add colored foreground lines for focus.
  foreground = svg.append("g")
      .attr("class", "foreground")
    .selectAll("path")
      .data(data)
    .enter().append("path")
      .attr("d", path)
      .style('stroke-width', '1.5')
      .style('stroke', function(d) { return d.color; })
      .on("mouseover", function(d){
        // Change stroke-width when mouseover
        d3.select(this).style('stroke-width', '4')
      })
      .on("mouseout", function(d){
        // Change stroke-width when mouseover
        d3.select(this).style('stroke-width', '1.5')
      })
      .on("click", function(d){
        // Append a path on the bottom graphs
        add_curve(d.year, d.month)
      });

  // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

  // Add an axis and title.
  g.append("g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d; });

  // Add and store a brush for each axis.
  g.append("g")
      .attr("class", "brush")
      .each(function(d) { d3.select(this)
        .call(y[d].brush = d3.svg.brush().y(y[d])
        .on("brush", brush)); })
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);
});

function path(d) {
  return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  // Get all the active brushes (the one that are not empty)
  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); });
  // Get the min and max covered by active brushes
  var extents = actives.map(function(p) { return y[p].brush.extent(); });

  // For all the foreground lines change the display property
  foreground.style("display", function(d) {
    // True only if every active brush cross the line
    bool = actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
    
    if (bool == "none"){
      d.visible = false;
    }
    else {
      d.visible = true;
    }
    return bool;
  }); 
}

function add_curve(year, month){
  // Get filename
  filename = 'csv_result/' + String(year) + '-' + String(month) + '.csv';
  console.log(filename)

  // Load the data
  d3.csv(filename, function(error, data) {
    if (error) return console.warn(error);
    // Parse the date
    data.forEach(function(d, i) {
      a = d.time.slice(8, d.time.length);
      d.time = '2015-01-' + a;
      d.time = parseDate(d.time);
      d.solar = parseFloat(d.solar)
      d.load = parseFloat(d.load)
      d.wind = parseFloat(d.wind)
      // d.time.month = 1;  // every data is set in January 2015
      // d.time.year = 2015;
    });

    // creating color domain for load curve
    // colorLoad.domain(d3.keys(data[0]).filter(function(key) { return key !== "time" && key !=="solar"
    //   && key !== "wind"; }));
    colorLoad.domain(['load']);

    // creating color domain for gen curves
    // colorGen.domain(d3.keys(data[0]).filter(function(key) { return key !== "time" && key !=="load"; }));
    colorGen.domain(['solar', 'wind']);

    loadData = colorLoad.domain().map(function(name) {
        return {
            name: name,
            label: String(year) + '-' + String(month) + ' ' + name,
            values: data.map(function(d) {
                return {time: d.time, data: +d[name]}; 
            })
        };
    });

    genData = colorGen.domain().map(function(name) {
        return {
            name: name,
            label: String(year) + '-' + String(month) + ' ' + name,
            values: data.map(function(d) {
                return {time: d.time, data: +d[name]}; 
            })
        };
    });

    // Find the min and max
    tempMin = d3.min(data, function(d){ return d.load});
    tempMax = d3.max(data, function(d){ return d.load});

    // Check against current ymin and ymax, update if necessary
    if (tempMin < minLoad){
      minLoad = tempMin;
    }

    if (tempMax > maxLoad){
      maxLoad = tempMax;
    }

    // Update scale
    loadScale.domain([minLoad, maxLoad]);
    svgLoad.select(".yLoad")
        .call(yAxis1);

    // Find the min and max
    tempMin1 = d3.min(data, function(d){ return d.solar});
    tempMax1 = d3.max(data, function(d){ return d.solar});
    tempMin2 = d3.min(data, function(d){ return d.wind});
    tempMax2 = d3.max(data, function(d){ return d.wind});
    tempMin = d3.min([tempMin1, tempMin2]);
    tempMax = d3.max([tempMax1, tempMax2]);

    // Check against current ymin and ymax, update if necessary
    if (tempMin < minGen){
      minGen = tempMin;
    }

    if (tempMax > maxGen){
      maxGen = tempMax;
    }

    // Update scale
    genScale.domain([minGen, maxGen]);
    svgGen.select(".yGen")
        .call(yAxis2);

    // Draw path
    classString = ".loadCurve" + String(count);
    loadCurve.push(svgLoad.selectAll(classString)
                    .data(loadData)
                    .enter().append("g")
                    .attr("class", "loadCurve"));

    // in each group append a path generator for lines and give it the bounded data 
    loadCurve[count].append("path")
        .attr("class", "line")
        .attr("clip-path", "url(#clipLoad)")
        .attr("d", function(d) { return lineLoad(d.values); })
        .style("stroke", function(d) { return finalColor(count); });

    // Append legend with a date

    // Draw path
    classString = ".genCurve" + String(count);
    genCurve.push(svgGen.selectAll(classString)
                    .data(genData)
                    .enter().append("g")
                    .attr("class", "genCurve"));

    // in each group append a path generator for lines and give it the bounded data 
    genCurve[count].append("path")
        .attr("class", "line")
        .attr("clip-path", "url(#clipGen)")
        .attr("d", function(d) { return lineGen(d.values); })
        .style("stroke", function(d) { return finalColor(count); });

    count = count + 1;

  });

}

function reset_all(){
  // Select SVGs and remove all
}

function brushend() {
  get_button = d3.select(".clear-button");
  if(get_button.empty() === true) {
    clear_button = svgGen.append('text')
      .attr("y", height)
      .attr("x", width + 10)
      .attr("class", "clear-button")
      .text("Clear Brush");
  }

  domain = brushLoadGen.extent();
  xLoadGen.domain(domain);

  transition_data();
  reset_axis();
  d3.select(".brush1").call(brushLoadGen.clear());
  d3.select(".brush2").call(brushLoadGen.clear());

  clear_button.on('click', function(){
    xLoadGen.domain([parseDate('2015-01-01 00:00:00'), parseDate('2015-01-31 23:00:00')]);
    transition_data();
    reset_axis();               
    clear_button.remove();
  });
}

function transition_data() {
  for (i=0; i<loadCurve.length; i++) {
    loadCurve[i].select(".line")
      .transition()
      .attr("d", function(d) { return lineLoad(d.values); });
    }

  for (i=0; i<genCurve.length; i++) {
    genCurve[i].select(".line")
      .transition()
      .attr("d", function(d) { return lineGen(d.values); });
    }
}

function reset_axis() {
  svgLoad.transition().duration(500)
   .select(".x.axis")
   .call(xAxis);

  svgGen.transition().duration(500)
   .select(".x.axis")
   .call(xAxis);
}
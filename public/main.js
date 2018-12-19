/*Created by Andrew Truett
https://github.com/AndrewTruett */


//***Create map***
var svg = d3.select("svg");
var gMap = svg.append("g");
var gChart = svg.append("g").attr("transform", "translate(900, 80)");

// New York central state plane, EPSG: 2829
// (central meridian = - 76.5833..., latitute of origin = 40)
var projection = d3.geoTransverseMercator()
        .rotate([76 + 35 / 60, - 40]);

var path = d3.geoPath()
    .projection(projection);

// Load the topojson and the population data
  var counties = "https://raw.githubusercontent.com/umbcvis/classes/master/class-14/counties.json";
  var crime = "https://raw.githubusercontent.com/AndrewTruett/datasets/master/Index_Crimes_by_County_and_Agency__Beginning_1990.csv";

  var indexTotal = {}; //Needed outside the ready function so the slider can see it

d3.queue()
    .defer(d3.json, counties)
    .defer(d3.csv, crime)
    .await(ready);

// Wait for the data to arrive, then begin processing
function ready(error, us, crime) {
  if (error) throw error;

  var keys = new Set(); //[[county, year], [county, year], ...]

  crime.forEach(function(d, i) {
    let newKey = d.County + "-" + d.Year;

    if(!newKey.includes("Region Total")) {

      //***Index Total***
      //Some entries don't have data, so check for empty strings
      let indexTotalInt;
      if(d["Index Total"] === "")
        indexTotalInt = 0;
      else
        indexTotalInt = parseInt(d["Index Total"], 10);

      if(typeof indexTotal[newKey] == "undefined")
        indexTotal[newKey] = indexTotalInt;
      else
        indexTotal[newKey] += indexTotalInt;
    }
  });

  // Convert the topojson to an array of GeoJSON counties
  var counties = topojson.feature(us, us.objects.counties);

  // Get NY counties as array of GeoJSON features
  var newyork = counties.features.filter(function(d) { return d.properties.STATEFP === '36'; })
  //console.log(newyork);

  projection.fitExtent([[10,10],[960 - 20, 500 - 20]], { type: "FeatureCollection", features: newyork });

  gMap.append("text")
    .attr("class", "title")
    .attr("x", 200)
    .attr("y", 30)
    .text("Index Total Crime in New York State");

  // Drop-shadow styling (this is blurred shadow)
  gMap.append("use")
      .attr("xlink:href", "#nation")
      .attr("fill-opacity", 0.2)
      .attr("filter", "url(#blur)");

  // Drop-shadow styling (this is white overlay)
  gMap.append("use")
      .attr("xlink:href", "#nation")
      .attr("fill", "#fff");

  // Plot counties
  gMap.selectAll('path.county')
      .data(newyork)
    .enter().append("path")
      .attr("d", path)
      .attr("class", "county")
      .attr("fill", "#fff")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .on('mouseover', function(d, i) {
        //Uncomment for testing purposes
        //console.log('mouseover:', i, d);
        d3.select(this).attr('fill', 'crimson');
        })
      .on('click', function(d) {
        //console.log(d);
        let countyName = d.properties.NAME;
        let year = d3.select("#year-text").html()

        //Request Data from the server
        var xhttp = new XMLHttpRequest();
        var myData;
        try {
          xhttp.open("GET", "get/"+countyName+"/"+year, false);
          xhttp.onreadystatechange = function() {
            if(this.readyState == 4 && this.status == 200) {
              myData = JSON.parse(this.responseText);
              //console.log("Variable type: "+ (typeof myData));
              console.log("Response from server: " + myData);
            }
          };
          xhttp.send(null);
        }
        catch(e) {
          console.log(e.toString());
        }

        gChart.selectAll("g").remove();
        createChart(countyName, year, myData);
        //createChart(countyName, year, murderInt, rapeInt, robberyInt, assaultInt, burglaryInt, larcenyInt, vehicleTheftInt);
        // murder, rape, robbery, assault, burglary, larceny, vehicleTheft
      })
      .on('mouseout', function(d) {
        d3.select(this).attr('fill', '#fff');
        d3.select(".info").html("")
      });


  updateMap(indexTotal, 1990);
}

//Index total is the dictionary with all the counties and years and their totals, year is the year we want to filter by
function updateMap(indexTotal, year) {
  let data = Object.entries(indexTotal);

  let filtered = data.filter(function(d) {
    return d[0].includes(String(year));
  });



  let maxCount = d3.max(filtered, d => d[1]);
  let steps = 9;
  let color    = d3.scaleThreshold()
                   .domain(d3.range(100, maxCount, maxCount/steps))
                   .range(d3.schemeReds[steps])

  //console.log(maxCount);
  //console.log(filtered)

 let counties = gMap.selectAll(".county").on("mouseover", function(d, i) {
   let key = d.properties.NAME + "-" + String(year);
   let total = String(indexTotal[key])
   if(total == "undefined") total = "0";
   d3.select(".info").html(d.properties.NAME + " County<br>Index Total: " + total);
 });

 counties.transition().duration(10).style("fill", function(d) {
   let county = d.properties.NAME;
   //console.log(county);
   let key = county + "-" + String(year);
   return color(indexTotal[key]);
 });

  counties.exit().transition().duration(10).style("fill", "#fff")

}



//***Chart***
//function createChart(county, year, murderNum, rapeNum, robberyNum, assaultNum, burglaryNum, larcenyNum, vehicleTheftNum) {
function createChart(county, year, data) {
  console.log("Plotting crime chart for " + county + " County, for the year of " + year);

  console.log(data);
  gChart.selectAll("#chart-title").remove();
  //translate (900, 80)

  var height = 400;
  var width = 600;

  var x = d3.scaleBand().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);

  x.domain(data.map(function(d) {return d[0];}));
  y.domain([0, d3.max(data, function(d) {return d[1];})]);

  gChart.append("text")
    .attr("id", "chart-title")
    .attr("x", 0)
    .attr("y", -10)
    .text("Crime Statistics for " + county + " County in the year " + year);

  gChart.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  gChart.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height*0.5)+20)
    .attr("y", -55)
    .text("Occurences");

  var bars = gChart.selectAll(".bar").remove().exit().data(data);


  bars.enter().append("rect")//.transition().duration(3000)
    .attr("class", "bar")
    .attr("x", function(d) {return x(d[0]);})
    .attr("width", x.bandwidth())
    .attr("y", function(d) {return y(d[1]);})
    .attr("height", function(d) {return height - y(d[1]);})
    //.on('mouseover', tip.show)
    //.on('mouseout', tip.hide);

  bars.merge()
    .attr("class", "bar")
    .attr("x", function(d) {return x(d[0]);})
    .attr("width", x.bandwidth())
    .attr("y", function(d) {return y(d[1]);})
    .attr("height", function(d) {return height - y(d[1]);});
}


//********************************************************


//***Slider***
var years = d3.range(0, 28).map(function (d) { return new Date(1990 + d, 10, 3); });

var yearSlider = d3.sliderHorizontal()
    .min(d3.min(years))
    .max(d3.max(years))
    .step(1000 * 60 * 60 * 24 * 365)
    .width(800)
    .tickFormat(d3.timeFormat('%Y'))
    .tickValues(years)
    .ticks(5)
    .on('onchange', val => {
      updateMap(indexTotal, d3.timeFormat("%Y")(yearSlider.value()));
      //Update plot
      d3.select("#year-text").text(d3.timeFormat("%Y")(val));
    });

var group3 = d3.select("#year-slider").append("svg")
    .attr("width", 960)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(30,30)");

group3.call(yearSlider);

d3.select("#year-text").text(d3.timeFormat('%Y')(yearSlider.value()));

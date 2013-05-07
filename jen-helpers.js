var fileData = null;
var fileXml = null;
var points = null;
var fileInput = document.createElement('input');
fileInput.type = "file";
fileInput.onchange = function(evt) {
	console.log('reading data...');
	var reader = new FileReader();
	reader.onloadend = function(evt) {
		fileData = evt.target.result;
		fileXML = new DOMParser().parseFromString(fileData, 'text/xml');
		points = [];
 		var trackpoints = fileXML.getElementsByTagName('Trackpoint');
		var trackpoint;
		for (var i =0, il = trackpoints.length; i < il; i++) {
			if (trackpoints[i].getElementsByTagName('LatitudeDegrees').length === 0) {
				continue;
			}
			points.push({
				time: new Date(trackpoints[i].getElementsByTagName('Time')[0].textContent),
				position: {
					lat: parseFloat(trackpoints[i].getElementsByTagName('LatitudeDegrees')[0].textContent),
					lon: parseFloat(trackpoints[i].getElementsByTagName('LongitudeDegrees')[0].textContent)
				},
				altitude: parseFloat(trackpoints[i].getElementsByTagName('AltitudeMeters')[0].textContent),
				distance: parseFloat(trackpoints[i].getElementsByTagName('DistanceMeters')[0].textContent),
				sensor: trackpoints[i].getElementsByTagName('HeartRateBpm')[0].textContent
			});
		}	
		console.log('finished reading data! Drawing plot box. Running processData()...')
		processData();
	};
	reader.readAsText(fileInput.files[0], 'utf-8');
};
document.getElementById('fileUploader').appendChild(fileInput);




function drawLine(startx, starty, endx, endy, color, width) {
  var path = paper.path(
    'M' + startx + ',' + starty + 
    'L' + endx + ',' + endy
  );
  if (width !== undefined) {
    path.attr('stroke-width', width);
  }
  if (color !== undefined) {
    path.attr('stroke', color);
  }
}

// Jen's stuff

//set paper size and plot size
var paperwidth = 800;
var paperheight = 240;

//define paper
var paper = Raphael(document.getElementById('paperContainer'), paperwidth, paperheight);

//draw plot box with paper.rect
drawPlotBox(20,20,paperwidth-40, paperheight-40);
drawPlotBox(0,0,paperwidth, paperheight);
function drawPlotBox(x,y,width,height) {
	paper.rect(x,y,width,height);
}
// plot a path using an array of coordinates (data) and drawLine(), define color and width
function plotPath (data, color, width) {
  for (var i=0; i<data.length; i++) {
    if (1+i<data.length) {
      var startx = data[i][0];
      var starty = paperheight-data[i][1];
      var nextx = data[i+1][0];
      var nexty = paperheight-data[i+1][1];
      drawLine(startx, starty, nextx, nexty, color, width);
    }
  }
}

//process data
function processData(){

  //define unprocessed vars from gpx
	var startTimeMS = points[0].time.getTime();
	var endTimeMS = points[points.length-1].time.getTime();
	var endDistanceM = points[points.length-1].distance;

  // derivative vars from gpx
	var timeRangeMS = endTimeMS - startTimeMS;

  //calculate max and min HR, elevation
	var minHR = 1000;
	var maxHR = 0;
  var minElevation = 1000000000;
	var maxElevation = 0;
	for (var k=0; k<points.length; k++) {
    if (points[k].altitude<minElevation) {
      minElevation = points[k].altitude;
    }
    if (points[k].altitude>maxElevation) {
			maxElevation = points[k].altitude;
		}
		if (parseInt(points[k].sensor)>maxHR) {
			maxHR = parseInt(points[k].sensor);
		}
		if (parseInt(points[k].sensor)<minHR) {
			minHR = parseInt(points[k].sensor);
		}
	}
  var rangeHR = maxHR - minHR;
  var rangeElevation = maxElevation - minElevation;
  
  // function to generate Time vs. Distance data array and plot it
  function plotTimeDistance(){
    var data=[];
    for (var i=0; i<points.length; i++) {
      data[i]=[];
      var normTime = (points[i].time.getTime()-startTimeMS) * paperwidth / timeRangeMS;
      var normDistance = (points[i].distance * paperheight / endDistanceM);
      data[i][0] = normTime;
      data[i][1] = normDistance;
    }
    //plot it!
    plotPath(data,'#00f',2);
  }
	plotTimeDistance();
  drawAxes(parseInt(timeRangeMS/60000), 0, parseInt(endDistanceM/1609), 0);

  // function to generate Time vs. Elevation data array and plot it
  function plotTimeElevation(){
    var data=[];
    for (var i=0; i<points.length; i++) {
      data[i]=[];
      var normTime = (points[i].time.getTime()-startTimeMS) * paperwidth / timeRangeMS;
      var normElevation = ((points[i].altitude * paperheight-minElevation) / maxElevation);
      data[i][0] = normTime;
      data[i][1] = normElevation;
    }
    plotPath(data, '#ddd',10);
    //plot it!
  }
//  plotTimeElevation();

  //function to generate Time vs. HR data array and plot it
  function plotTimeHR(){
    var data=[];
    for (var i=0; i<points.length; i++) {
      data[i]=[];
      var normTime = (points[i].time.getTime()-startTimeMS) * paperwidth / timeRangeMS;
      var normHR = (parseInt(points[i].sensor)-minHR) * paperheight / rangeHR;
      data[i][0] = normTime;
      data[i][1] = normHR;
    }
    plotPath(data, '#f00',2);
    //plot it!
  }
//  plotTimeHR();

  //function to generate Distance vs. Elevation data array and plot it
  function plotDistanceElevation(){
    var data=[];
    for (var i=0; i<points.length; i++) {
      data[i]=[];
      var normDistance = (points[i].distance * paperwidth / endDistanceM);
      var normElevation = (points[i].altitude * paperheight / maxElevation);
      data[i][0] = normDistance;
      data[i][1] = normElevation;
    }
    plotPath(data, '#0f0', 2);
  }
//  plotDistanceElevation();
}

// function to draw axes
function drawAxes(rangeX, minX, rangeY, minY){
  var tickHeight = 10;
  var labelPadding = 5;
  for (var i=0; i<10; i++) {
    var xTick = i*paperwidth / 10;
    drawLine(xTick, paperheight, xTick, paperheight-tickHeight);
    paper.text(xTick, paperheight-tickHeight-labelPadding, minX+i*rangeX/10);
    var yTick = paperheight-i*paperheight/10;
    drawLine(0,yTick,tickHeight, yTick);
    paper.text(tickHeight+labelPadding, yTick, minY+i*rangeY/10);
  }
}    


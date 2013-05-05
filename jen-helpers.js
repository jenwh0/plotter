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

var paperwidth = 800;
var paperheight = 240;
var paper = Raphael(document.getElementById('paperContainer'), paperwidth, paperheight);

drawPlotBox(0,0,paperwidth, paperheight);

function drawPlotBox(x,y,width,height) {
	paper.rect(x,y,width,height);
}

// drawPlotBox('#00f',4);

//function drawPlotBox(color, width){
//	drawLine (0,0,0,paperheight, color, width);
//	drawLine (0,paperheight,paperwidth,paperheight, color, width);
//	drawLine (paperwidth,paperheight,paperwidth,0, color, width);
//	drawLine (paperwidth,0,0,0, color, width);
//}
function processData() {
		var startingTimeMS = points[0].time.getTime();
		var endTimeMS = points[points.length-1].time.getTime();
		var timeRangeMS = endTimeMS - startingTimeMS;
		var endDistanceM = points[points.length-1].distance; 
    var minElevation = 1000000000;
    var maxElevation = 0;
		for (var k=0; k<points.length; k++) {
			if (points[k].altitude > maxElevation) {
				maxElevation = points[k].altitude;
			}
      if (points[k].altitude <minElevation) {
        minElevation = points[k].altitude;
      }
		}
    console.log("minElevation: ", minElevation);
    console.log("maxElevation: ", maxElevation);
	function plotTimeDistance () {
		var data =[];
		for (var j=0; j<points.length; j++) {
			data[j]=[];
			var normTime = (points[j].time.getTime()-startingTimeMS)*paperwidth/timeRangeMS;
			var normDistance = (points[j].distance*paperheight/endDistanceM);	
			data[j][0] = normTime;
			data[j][1] = normDistance;
		}
		for (var i=0; i<data.length; i++) {
			if (i+1<data.length) {
				var startx = data[i][0];
				var starty = paperheight-data[i][1];
				var nextx = data[i+1][0];
				var nexty = paperheight-data[i+1][1];
				drawLine(startx, starty, nextx, nexty, '#f00', 5);
			}
		}

	}

	function plotTimeElevation () {
		var data = [];

		for (var j=0; j<points.length; j++) {
			data[j]=[];
			var normTime = (points[j].time.getTime()-startingTimeMS)*paperwidth/timeRangeMS;
			var normElevation = ((points[j].altitude*paperheight-minElevation)/maxElevation);	
			data[j][0] = normTime;
			data[j][1] = normElevation;
		}
		for (var i=0; i<data.length; i++) {
			if (i+1<data.length) {
				var startx = data[i][0];
				var starty = paperheight-data[i][1];
				var nextx = data[i+1][0];
				var nexty = paperheight-data[i+1][1];

				drawLine(startx, starty, nextx, nexty, '#ddd', 4);
			
			}
		}

	}

	function drawAxes (){

//		drawPlotBox('#000',4);
		var tickHeight = 10;
		var labelPadding = 5;
		for (var i=0; i<10; i++) {
			var xTick = i * paperwidth / 10;
			drawLine(xTick,paperheight,xTick,paperheight-tickHeight);
			paper.text(xTick, paperheight-tickHeight-labelPadding, parseInt((i*timeRangeMS/10)/(60000)));
		}
		for (var j=1; j<10; j++) {
			var yTick = paperheight - (j * paperheight / 10);
			drawLine(0, yTick,tickHeight,yTick);
			paper.text(tickHeight+labelPadding+20, yTick, parseInt((j*endDistanceM/10)));
			drawLine(paperwidth-tickHeight, yTick, paperwidth, yTick);
			paper.text(paperwidth-tickHeight-labelPadding-20, yTick, parseInt((j*maxElevation/10)));
		}
		paper.text(paperwidth/2,paperheight-40,'Time(minutes)'); 
		paper.text(70, paperheight/2,'Distance(meters)').transform("r90"); 
		paper.text(paperwidth-70, paperheight/2,'Altitude(meters)').transform("r-90"); 
	}

	plotTimeElevation();
	plotTimeDistance();

	drawAxes();

}

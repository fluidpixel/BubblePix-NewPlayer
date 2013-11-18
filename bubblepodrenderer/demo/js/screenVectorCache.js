var SmallScreen = function(cache, canvasSize, textureSize) {
	
	var vectorCache = null;
	vectorCache = ParseCache(cache, canvasSize);
	
	console.log("Returning cache");
	return vectorCache;

};

function parseDouble(value){
  if(typeof value == "string") {
    value = value.match(/^-?\d*/)[0];
  }
  
  return !isNaN(parseInt(value)) ? value * 1 : NaN;
}

function ParseCache(cache, size) {
	console.log("parseCache");

	var index = (size * size * 2 - 1);
	var myArray = cache.split(" ");

	console.log("Array Length " + myArray.length);
	var vectorCache = new Array(Math.floor(size * size * 2));
	console.log("vector cache size: " + vectorCache.length);
	//for each lh and lv
	//put into vectorCache index
	//increment index
	for (var i = 1; i < myArray.length && index >= 0; i += 2) {
		
		var lv = parseDouble(myArray[i ]);
		var lh = parseInt(myArray[i + 1]);

		if (isNaN(lv))
			console.log("NAN " + i);
		if (isNaN(lh))
			console.log("NAN " + i+1);

		vectorCache[index] = {
			lv : lv,
			lh : lh
		};

		if (vectorCache[index] == undefined) {
			console.log("undefined");
		}

		index--;

	}

	console.log("Written vectors:  " + index);
	return vectorCache;

}

var FullScreen = function(cache, canvasSize, textureSize) {
	var vectorCache = null;
	vectorCache = ParseCache(cache, canvasSize);
	
	console.log("Returning cache");
	return vectorCache;

};

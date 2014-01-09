/*!
* Sphere.js JavaScript Library v0.2
* https://github.com/SamHasler/sphere
*
* Copyright 2012 Samuel David Hasler
* Released under the MIT license
*/

// Description
// -----------

// **Sphere** renders a mathematically perfect textured sphere.
// It calculates the surface of the sphere instead of approximating it with triangles.

/*jshint laxcomma: true, laxbreak: true, browser: true */

(function() {"use strict";

	var timerStart = new Date().getTime();

	var opts = {
		tilt : 0,
		turn : 0,
		fpr : 1
	};

	var bubble_details = {
		//initialization values, should be overwritter by calling function setXXXParameters in demo.html
		uPerp : 0.5,
		vPerp : 0.5,
		minDiam : 0.000001,
		maxDiam : 0.62,
		MAX_WIDTH : 0
	};

	var xml_details = {
		cX : 0.0,
		cY : 0.0,
		width : 0.0,
		height : 0.0,
		innerCircle : 0.0,
		flippedX : false,
		flippedY : false,
		autoPan : 0.00
	};

	var renderAnimationFrame;
	var earth;
	var textureData;
	var canvasData;

	var copyFnc;
	// frame count, current angle of rotation. inc/dec to turn.
	var frame_count = 10000;
	var gCanvas, gCtx;
	var gImage, gCtxImg;
	var isUnWrappedImage = false;
	var isUnWrappedVideo = false;
	//Variable to hold the size of the canvas
	var size, cWidth, cHeight;
	var canvasImageData, textureImageData;

	// Number of frames for one complete rotation.
	var fpr = 8;

	// Constants for indexing dimentions
	var X = 0, Y = 1, Z = 2;

	// vertical and horizontal position on canvas
	var v, h;

	var textureWidth, textureHeight;

	var hs = 1;
	// Horizontal scale of viewing area
	var vs = 1;
	// Vertical scale of viewing area
	var xRot = 0.0001;
	var yRot = 0;
	// NB    The viewing area is an abstract rectangle in the 3d world and is not
	//    the same as the canvas used to display the image.

	var F = [0, 0, 0];
	// Focal point of viewer
	var S = [0, 0, 0];
	// Centre of sphere/planet

	var r = 1;
	// Radius of sphere/planet

	// Distance of the viewing area from the focal point. This seems
	// to give strange results if it is not equal to S[Y]. It should
	// theoreticaly be changable but hs & vs can still be used along
	// with r to change how large the sphere apears on the canvas.
	// HOWEVER, the values of hs, vs, S[Y], f & r MUST NOT BE TOO BIG
	// as this will result in overflow errors which are not traped
	// and do not stop the script but will result in incorrect
	// displaying of the texture upon the sphere.
	var f = 30;

	// There may be a solution to the above problem by finding L in
	// a slightly different way.
	// Since the problem is equivelent to finding the intersection
	// in 2D space of a line and a circle then each view area pixel
	// and associated vector can be used define a 2D plane in the 3D
	// space that 'contains' the vector S-F which is the focal point
	// to centre of the sphere.
	//
	// This is essentialy the same problem but I belive/hope it will
	// not result in the same exact solution. I have hunch that the
	// math will not result in such big numbers. Since this abstract
	// plane will be spinning, it may be posilbe to use the symetry
	// of the arangement to reuse 1/4 of the calculations.

	// Variables to hold rotations about the 3 axis
	var RX = 0, RY, RZ;
	// Temp variables to hold them whilst rendering so they won't get updated.
	var rx = null;
	var ry = null;
	var rz = null;
	var a;
	var b;
	var b2;
	// b squared
	var bx = F[X] - S[X];
	// = 0 for current values of F and S
	var by = F[Y] - S[Y];
	var bz = F[Z] - S[Z];
	// = 0 for current values of F and S

	// c = Fx^2 + Sx^2 -2FxSx + Fy^2 + Sy^2 -2FySy + Fz^2 + Sz^2 -2FzSz - r^2
	// for current F and S this means c = Sy^2 - r^2

	var c = F[X] * F[X] + S[X] * S[X] + F[Y] * F[Y] + S[Y] * S[Y] + F[Z] * F[Z] + S[Z] * S[Z] - 2 * (F[X] * S[X] + F[Y] * S[Y] + F[Z] * S[Z]) - r * r;

	var c4 = c * 4;
	// save a bit of time maybe during rendering

	var s;

	var m1 = 0;
	//double m2 = 0;

	// The following are use to calculate the vector of the current pixel to be
	// drawn from the focus position F

	var hs_ch;
	// horizontal scale divided by canvas width
	var vs_cv;
	// vertical scale divided by canvas height
	var hhs = 0.5 * hs;
	// half horizontal scale
	var hvs = 0.5 * vs;
	// half vertical scale

	var V = new Array(3);
	// vector for storing direction of each pixel from F
	var L = new Array(3);
	// Location vector from S that pixel 'hits' sphere
	var lastTime = 0;
	var VY2 = f * f;
	// V[Y] ^2  NB May change if F changes

	var rotCache = {};
	function calcL(lx, ly, rz) {
		//      var L = new Array(3);
		//      L[X]=lx*Math.cos(rz)-ly*Math.sin(rz);
		//      L[Y]=lx*Math.sin(rz)+ly*Math.cos(rz);

		var key = "" + lx + "," + ly + "," + rx;
		if (rotCache[key] == null) {
			rotCache[key] = 1;
		} else {
			rotCache[key] = rotCache[key] + 1;
		}
	}

	var rySin = undefined;
	var ryCos = undefined;
	var rzSin = undefined;
	var rzCos = undefined;
	//only gets called on sphere init
	var calculateVector = function(h, v) {
		V[X] = (hs_ch * h) - hhs;

		// V[Y] always the same as view frame doesn't mov
		V[Z] = (vs_cv * v) - hvs;

		a = V[X] * V[X] + VY2 + V[Z] * V[Z];

		s = (b2 - a * c4);

		if (s > 0) {

			
		var srz = Math.sin(rz);
		 var crz = Math.cos(rz);
		 var sry = Math.sin(ry);
		var cry = Math.cos(ry);
			

			m1 = ((-b) - (Math.sqrt(s))) / (2 * a);
			Y = Y;

			L[X] = m1 * V[X];
			L[Y] = by + (m1 * V[Y]);
			L[Z] = m1 * V[Z];

			var lx = L[X];
			L[X] = lx * crz - L[Y] * srz;
			L[Y] = lx * srz + L[Y] * crz;
			var lz;
			lz = L[Z];
			L[Z] = lz * cry - L[Y] * sry;
			L[Y] = lz * sry + L[Y] * cry;

			var lh = textureWidth + textureWidth * (Math.atan2(L[Y], L[X]) + Math.PI ) / (2 * Math.PI);
			var lv = textureWidth * Math.floor(textureHeight - 1 - (textureHeight * (Math.acos(L[Z] / r) / Math.PI) % textureHeight));
			if (counter > 0)
				console.log ("lh " + lh + ":" + lv + " lv");
			counter--;
			return {
				lv : lv,
				lh : lh
			};
		}
		return null;
	};

	/**
	 * Create the sphere function opject
	 */
	var fullScreenCache = undefined;
	var smallScreenCache = undefined;
	var cache = undefined;
	var counter = 15;
	var sphere = function(reuse) {
		rySin = undefined;
		rx = null;
		//textureData = textureImageData.data;
		canvasData = canvasImageData.data; copyFnc;

		if (canvasData.splice) {
			//2012-04-19 splice on canvas data not supported in any current browser
			copyFnc = function(idxC, idxT) {
				canvasData.splice(idxC, 4, textureData[idxT + 0], textureData[idxT + 1], textureData[idxT + 2], 255);
			};
		} else {
			copyFnc = function(idxC, idxT) {
				canvasData[idxC + 0] = textureData[idxT + 0];
				canvasData[idxC + 1] = textureData[idxT + 1];
				canvasData[idxC + 2] = textureData[idxT + 2];
				canvasData[idxC + 3] = 255;
			};
		}

		var getVector = (function() {
			if (isFullScreen) {
				if (fullScreenCache === undefined)
					fullScreenCache = new Array(cWidth * cHeight);
			} else {
				if (smallScreenCache === undefined)
					smallScreenCache = new Array(cWidth * cHeight);
			}
			return function(pixel) {
				if (isFullScreen) {
					if (fullScreenCache[pixel] === undefined) {
						if (!reuse) {
							var v = Math.floor(pixel / cWidth);
							var h = pixel - v * cWidth;

							fullScreenCache[pixel] = calculateVector(h, v);

							if (pixel == 0) {
								var diff = (new Date().getTime() - timerStart);
								console.log("Time Taken T Load to 0: " + diff);
							}
							if (pixel == (cWidth * cHeight) - 1) {
								var diff = (new Date().getTime() - timerStart);
								console.log("Time Taken TO Load to pixel length: " + diff);
							}
						}
					}
					return fullScreenCache[pixel];

				} else {
					if (smallScreenCache[pixel] === undefined) {
						if (!reuse) {
							var v = Math.floor(pixel / cWidth);
							var h = pixel - v * cWidth;
							smallScreenCache[pixel] = calculateVector(h, v);
							if (pixel == 0) {
								var diff = (new Date().getTime() - timerStart);
								console.log("Time Taken T Load to 0: " + diff);
							}
							if (pixel == (cWidth * cHeight) - 1) {
								var diff = (new Date().getTime() - timerStart);
								console.log("Time Taken TO Load to pixel length: " + diff);
							}
						}
					}
					return smallScreenCache[pixel];
				}
				/*
				 if (cache[pixel] === undefined) {
				 if (!reuse) {
				 var v = Math.floor(pixel / cWidth);
				 var h = pixel - v * cWidth;
				 if (pixel == 0) {
				 var diff = (new Date().getTime() - timerStart);
				 console.log("Time Taken T Load to 0: " + diff);
				 }
				 if (pixel == (cWidth * cHeight) - 1) {
				 var diff = (new Date().getTime() - timerStart);
				 console.log("Time Taken TO Load to pixel length: " + diff);
				 }
				 cache[pixel] = calculateVector(h, v);

				 }
				 }
				 return cache[pixel];*/

			};
		})();

		var posDelta = textureWidth * 0.00005;
		//textureWidth / (20 * 1000
		var firstFramePos = (new Date()) * posDelta;

		//var stats = {
		//	fastCount : 0,
		//	fastSumMs : 0
		//};

		return {
			renderFrame : function(time) {
				this.RF(time);
				return;
				stats.firstMs = new Date() - time;
				this.renderFrame = this.sumRF;
				console.log(rotCache);
				for (var key in rotCache) {
					if (rotCache[key] > 1) {
						console.log(rotCache[key]);
					}
				}
			},
			sumRF : function(time) {
				this.RF(time);
				stats.fastSumMs += new Date() - time;
				stats.fastCount++;
				if (stats.fastSumMs > stats.firstMs) {
					//       alert("calc:precompute ratio = 1:"+ stats.fastCount +" "+ stats.fastSumMs +" "+ stats.firstMs);
					this.renderFrame = this.RF;
				}
			},

			//gets called every frame

			RF : function(time) {
				// RX, RY & RZ may change part way through if the newR? (change tilt/turn) meathods are called while
				// this meathod is running so put them in temp vars at render start.
				// They also need converting from degrees to radians

				/*
				 yRotVal *= ( (time - lastTime) * posDelta)/10;
				 yRotVal = Math.floor(yRotVal);*/
				startTime2Render = new Date().getTime();

				if (rx === null)
					calculateR();

				if (failedBottomY) {
					if (yRotVal < lastLegitYRot) {
						failedBottomY = false;
						lastLegitYRot = yRotVal;

					} else {
						if (!mouseIsDown) {
							yMovement -= 12;
							yRotVal -= 12;
							yRot -= 12;
						}
					}
				}
				if (failedTopY) {
					if (yRotVal > lastLegitYRot) {
						failedTopY = false;
						lastLegitYRot = yRotVal;
					} else {
						if (!mouseIsDown) {
							//	lastLegitYRot += 15;
							yMovement += 12;
							yRotVal += 12;
							yRot += 12;
						}
					}
				}

				// add to 24*60*60 so it will be a day before turnBy is negative and it hits the slow negative modulo bug
				var pixel = cWidth * cHeight;

				//yRotVal = YClamp(yRotVal);
				var xRotNumber = xRot;

				var xNumber = 0;

				xNumber = xMovement;
				var startTime2Render = new Date().getTime();
				var idxC = (pixel - 1) * 4;
				var vector;
				var finalYRotation = (textureHeight * lastLegitYRot );
				var processIndex = 0;
				if (!isFullScreen) {

					if (smallScreenCache[pixel - 1] === undefined)
						processIndex = 0;
					else
						processIndex = 1;
				} else {
					if (fullScreenCache[pixel - 1] === undefined)
						processIndex = 0;
					else
						processIndex = 2;
				}

				while (pixel--) {

					switch(processIndex) {
						case 1:
							vector = smallScreenCache[pixel];
							break;
						case 2:
							vector = fullScreenCache[pixel];
							break;
						default:
							vector = getVector(pixel);
					}

					var lh = Math.round(vector.lh + xRotNumber) % textureWidth;

					//YAxis Rotation
					var lv = (vector.lv);

					//if (!isUnWrappedImage)
						lv += finalYRotation;

					var idxT = ((lh + lv) << 2);

					canvasData[idxC] = textureData[idxT];
					canvasData[++idxC] = textureData[++idxT];
					canvasData[++idxC] = textureData[++idxT];
					canvasData[++idxC] = textureData[++idxT];
					idxC -= 7;
				}

				if (yCheckBool) {
					if (!isLegitYRot()) {
						if (!mouseIsDown && (failedBottomY || failedTopY)) {
							console.log("Non Legit yRot: " + yRotVal);
						}
					} else {
						if (!mouseIsDown && (failedBottomY || failedTopY)) {
							console.log("Legit yRot: " + yRotVal);
						}
						lastLegitYRot = yRotVal;
						failedBottomY = false;
						failedTopY = false;
					}
				} else if (!(failedBottomY || failedTopY)) {
					lastLegitYRot = yRotVal;
				}
				yCheckBool = !yCheckBool;

				var multiplier = 50000;
				if (isFullScreen)
					multiplier /= 3;
				xRot += xNumber * multiplier * (time - lastTime) * posDelta;
				//bcv.putImageData(canvasImageData, 0, 0);
				putdata();
				lastTime = time;

				var time2Render = (new Date().getTime() - startTime2Render);
				//	console.log("Time to render: " + time2Render);
			}
		};
	};

	var yCheckBool = false;
	function putdata() {
		/*
		 var len = cWidth * cHeight * 4;
		 var segmentLength = len / workersCount;
		 var blockSize = cHeight / workersCount;

		 for (var index = 0; index < workersCount; index++) {
		 var canvasData = bcv.getImageData(0, blockSize * index, cWidth, blockSize);
		 worker[index].postMessage({
		 data : canvasData,
		 index : index,
		 length : segmentLength,
		 textureData: textureData
		 });
		 }*/
		gCtx.putImageData(canvasImageData, 0, 0);
	}

	function g() {
		// more stuff

	}

	function readFromCache() {
		if (textureWidth == 8192) {
		} else if (textureWidth == 4096) {

		} else if (textureWidth == 2048) {

		} else {
			//not valid image;
		}
	}

	function calculateR() {
		console.log("Calculating r");
		rx = RX * Math.PI / 180;
		ry = RY * Math.PI / 180;
		rz = RZ * Math.PI / 180;
	}

	function cropBubblePodImage(imageData, outerWidth, outerHeight, innerWidth, innerHeight) {

		var innerImageMinDiam = bubble_details.minDiam;
		var innerImageMaxDiam = bubble_details.maxDiam;

		var imagePixels = imageData.data;
		var pixelOffset = outerHeight / 2 - innerHeight / 2;
		var minPixel = innerHeight * innerImageMinDiam;
		minPixel += pixelOffset;
		minPixel = Math.floor(minPixel);
		var maxPixel = innerHeight * innerImageMaxDiam;
		maxPixel += pixelOffset;
		maxPixel = Math.floor(maxPixel);
		console.log(minPixel + " min:max " + maxPixel);
		console.log(outerHeight + " outWidth:outHeight " + outerWidth);
		var buf = [];

		var pixelIndex = 0;
		for (var x = 0; x < outerWidth; x++) {
			for (var y = 0; y < outerHeight; y++) {
				pixelIndex = (y * outerWidth + x) * 4;
				if (y < minPixel || y > maxPixel) {
					imagePixels[pixelIndex + 0] = 0;
					imagePixels[pixelIndex + 1] = 0;
					imagePixels[pixelIndex + 2] = 0;
					imagePixels[pixelIndex + 3] = 0;
				} else {

					var xPix = imagePixels[pixelIndex];
					var yPix = imagePixels[pixelIndex + 1];
					var zPix = imagePixels[pixelIndex + 2];
					var wPix = 255;
					buf.push(xPix);
					buf.push(yPix);
					buf.push(zPix);
					buf.push(wPix);

					imagePixels[pixelIndex + 0] = 0;
					imagePixels[pixelIndex + 1] = 0;
					imagePixels[pixelIndex + 2] = 0;
					imagePixels[pixelIndex + 3] = 0;

				}
			}
		}

		//redraw & reposition
		var newHeight = maxPixel - minPixel;
		var startPixel = Math.floor(outerHeight / 2 - newHeight / 2);
		var bufferIndex = 0;
		console.log("Start Y " + startPixel);
		console.log("New Height " + newHeight);
		console.log("OuterHeight" + outerHeight);
		textureClampHeight = newHeight;
		for (var u = 0; u < outerWidth; u++) {
			for (var v = startPixel; v <= startPixel + newHeight; v++) {
				pixelIndex = (v * outerWidth + u) * 4;
				if (v >= startPixel && v <= startPixel + newHeight) {
					imagePixels[pixelIndex + 0] = buf[bufferIndex + 0];
					imagePixels[pixelIndex + 1] = buf[bufferIndex + 1];
					imagePixels[pixelIndex + 2] = buf[bufferIndex + 2];
					imagePixels[pixelIndex + 3] = buf[bufferIndex + 3];
					bufferIndex += 4;
				}
			}
		}
		buf = null;
		return imageData.data;
	}

	function convertToEqui(imageData, width, height, offsetWidth, offsetHeight) {

		if (offsetHeight > 0) {
			var multiplier = (height + offsetHeight * 3) / height;
			bubble_details.maxDiam /= multiplier;
			bubble_details.minDiam /= multiplier;
		} else if (offsetWidth > 0) {
			var multiplier = (width + offsetWidth * 3 ) / width;
			bubble_details.maxDiam /= multiplier;
			bubble_details.minDiam /= multiplier;
		}
		console.log ("mindiam: " + bubble_details.minDiam);
		console.log ("maxdiam: " + bubble_details.maxDiam);
		var pixelAmount = 0;
		var angleOffsetRadians = Math.PI;
		var fullHeight = width / (2 * Math.PI );
		textureClampHeight = fullHeight;
		var replacePixel = Math.floor((height * width) / 2 - (fullHeight * width ) / 2);
		replacePixel *= 4;
		console.log ("replacePixel " + replacePixel);
		var texImageData = imageData.data;
		var minRadius = bubble_details.minDiam * 0.5;
		var maxRadius = bubble_details.maxDiam * 0.5;
		var buf = [];
		for (var i = 0; i < fullHeight; ++i) {
			var amplitude = ((maxRadius - minRadius ) * (i / fullHeight ) ) + minRadius;

			for (var j = 0; j < width; ++j) {

				var longitudeAngle = (2 * Math.PI * (j / width ) ) + angleOffsetRadians;

				var sinLongAngle = Math.sin(longitudeAngle);
				var cosLongAngle = Math.cos(longitudeAngle);

				var u = (1.00) * sinLongAngle;
				var v = cosLongAngle;

				u *= amplitude;
				v *= amplitude;

				u += bubble_details.uPerp;
				v += bubble_details.vPerp;

				var xPixel = Math.floor(u * width);
				var yPixel = height - Math.floor(v * height);

				var pixel = ((xPixel * width + yPixel) * 4);
				var xPix = texImageData[pixel];
				var yPix = texImageData[pixel + 1];
				var zPix = texImageData[pixel + 2];

				buf.push(xPix);
				buf.push(yPix);
				buf.push(zPix);

				pixelAmount++;
			}
		}
		var bufIndex = buf.length - 1;
		////console.log("Pixels affected: " + pixelAmount);
		console.log ("bufindex: " +bufIndex);
		for (var i = 0; i < height * width * 4; i += 4) {
			if (i != replacePixel) {
				texImageData[i] = 0;
				texImageData[i + 1] = 0;
				texImageData[i + 2] = 0;
				texImageData[i + 3] = 255;
			} else {
				if (bufIndex > 0) {
					texImageData[i] = buf[bufIndex - 2];
					texImageData[i + 1] = buf[bufIndex - 1];
					texImageData[i + 2] = buf[bufIndex];
					texImageData[i + 3] = 255;
					replacePixel += 4;
					bufIndex -= 3;
				}
			}
		}
		buf = null;
		console.log ("imageData.length " +imageData.data.length);
		return imageData;
	}

	function copyImageToBuffer(aImg) {
		var needsReloading = false;
		if (originalImage === undefined || isUnWrappedVideo) {
			originalImage = aImg;
			needsReloading = true;
		}

		if (!isUnWrappedImage) {//bubblepod image
			if (needsReloading) {

				var newWidth = aImg.width;
				var newHeight = aImg.height;
				var oldWidth = aImg.width;
				var resize = false;

				if (bubble_details.MAX_WIDTH) {
					if (oldWidth > bubble_details.MAX_WIDTH) {
						newHeight *= bubble_details.MAX_WIDTH / newWidth;
						newWidth = bubble_details.MAX_WIDTH;
						resize = true;
					}
				} else {
					resize = true;
				}

				gImage = document.createElement('canvas');
				gCtxImg = gImage.getContext("2d");
				var newImageData = undefined;
				newWidth = Math.floor(newWidth);
				newHeight = Math.floor(newHeight);
				backcvs = document.getElementById('backCanvas');
				bcv = backcvs.getContext("2d");
				if (resize) {
					gImage.width = newWidth;
					gImage.height = newHeight;
					gCtxImg.clearRect(0, 0, newWidth, newHeight);
					gCtxImg.drawImage(aImg, 0, 0, newWidth, newHeight);
					newImageData = gCtxImg.getImageData(0, 0, newWidth, newHeight);
					//var newData = newImageData.zz
					console.log("Resized IMAGEDATA Bytes: " + newImageData.data.length);
					console.log("Have Resized Image");
					gCtxImg.clearRect(0, 0, newWidth, newHeight);
					console.log("NEWIMAGEDATA: " + newImageData.data.length);
				}
				var max = Math.max(newWidth, newHeight);
				if (max) {
					textureWidth = max;
					textureClampHeight = newHeight;
					textureHeight = max;
				}

				console.log("Texture Width = " + newWidth);
				console.log("Texture height = " + newHeight);
				gImage.width = textureWidth;
				gImage.height = textureHeight;
				gCtxImg = gImage.getContext("2d");
				gCtxImg.clearRect(0, 0, textureHeight, textureWidth);
				if (resize) {
					gCtxImg.putImageData(newImageData, Math.floor((max - newWidth) / 2), Math.floor((max - newHeight) / 2));
				} else {
					gCtxImg.drawImage(aImg, 0, Math.floor((max - newHeight) / 2));
				}
				textureImageData = gCtxImg.getImageData(0, 0, textureHeight, textureWidth);
				console.log("FINALIMAGEDATA: " + textureImageData.data.length);
				gCtxImg = null;
				if (resize) {
					textureData = cropBubblePodImage(textureImageData, textureWidth, textureHeight, 0, newHeight);
				} else {
					textureData = cropBubblePodImage(textureImageData, textureWidth, textureHeight, 0, aImg.height);
				}
				console.log("Final Texture Width = " + textureWidth + "Height: " + textureHeight);
			}
		} else if (isUnWrappedImage && !isUnWrappedVideo) {
			// mad bubblepix image
			if (needsReloading) {
				//resizing
				console.log("version 5");
				var subsampled = false;
				var newWidth = aImg.width;
				var newHeight = aImg.height;
				var oldWidth = aImg.width;
				backcvs = document.getElementById('backCanvas');
				bcv = backcvs.getContext("2d");
				
				 if (detectSubsampling(aImg))
				 {
					newHeight /=detectVerticalSquash(aImg, newWidth, newHeight);
				 				if (oldWidth > bubble_details.MAX_WIDTH) {
					newHeight *=(bubble_details.MAX_WIDTH / newWidth);
					newWidth = bubble_details.MAX_WIDTH;
				}
					newWidth = Math.floor(newWidth);
					newHeight = Math.floor(newHeight);
					console.log("detect vert squash: " + detectVerticalSquash(aImg, newWidth, newHeight));
					console.log("image is subsampled");
					subsampled = true;
					/*var tmp = bubble_details.vPerp;
					bubble_details.vPerp= 1-bubble_details.uPerp;
					bubble_details.uPerp= 1-tmp;*/
					backcvs.width = newWidth;
					backcvs.height = newHeight;
					bcv = backcvs.getContext("2d");
					bcv.drawImage(aImg, 0, 0, newWidth, newHeight );
					 newWidth = bubble_details.MAX_WIDTH-1;
					 newHeight = newWidth * (aImg.naturalHeight / aImg.naturalWidth);
					newWidth = Math.floor(newWidth);
					newHeight = Math.floor(newHeight);
				
						 console.log ("newWidth " + newWidth);
					console.log ("newHeight " + newHeight);
					gImage = document.createElement('canvas');
					gCtxImg = gImage.getContext("2d");
					var newImageData = undefined;
					
					newImageData = bcv.getImageData(0, 0, newWidth, newHeight);
					gCtxImg.clearRect(0, 0, newWidth, newHeight);
						
				 }
				 else
				 {
					
	
				if (oldWidth > bubble_details.MAX_WIDTH) {
					newHeight *= bubble_details.MAX_WIDTH / newWidth;
					newWidth = bubble_details.MAX_WIDTH;
				}
						 backcvs.width = newWidth;
					backcvs.height = newHeight;
					bcv = backcvs.getContext("2d");
					bcv.drawImage(aImg, 0, 0, newWidth, newHeight );
				 console.log("image is not subsampled");
				
				gImage = document.createElement('canvas');
				gCtxImg = gImage.getContext("2d");
				var newImageData = undefined;
				newWidth = Math.floor(newWidth);
				newHeight = Math.floor(newHeight);		
				newImageData = bcv.getImageData(0, 0, newWidth, newHeight);
				
				 }
				
			
				//end resizing
				var max = Math.max(newWidth, newHeight);
				if (max) {
					textureWidth = max;
					textureClampHeight = newHeight;
					textureHeight = max;
				}
				gCtxImg.clearRect(0, 0, newWidth, newHeight);
				gImage.width = textureWidth;
				gImage.height = textureHeight;
				gCtxImg = gImage.getContext("2d");
				gCtxImg.clearRect(0, 0, textureHeight, textureWidth);
				gCtxImg.putImageData(newImageData, Math.floor((max - newWidth) / 2), Math.floor((max - newHeight) / 2));
				textureImageData = gCtxImg.getImageData(0, 0, textureHeight, textureWidth);
				textureImageData = convertToEqui(textureImageData, textureWidth, textureHeight, Math.floor((max - newWidth) / 2), Math.floor((max - newHeight) / 2));				
				textureData = textureImageData.data;
				console.log ("finalWidth " + gImage.width);
				console.log ("finalHeight " + gImage.height);
				
			}
		} else {
			//video
			if (needsReloading) {
				gImage = document.createElement('canvas');
				backcvs = document.getElementById('backCanvas');
				bcv = backcvs.getContext("2d");
				var backCWidth = backcvs.width;
				var backCHeight = backcvs.height;
				//console.log("backCanvasWidth " + backCWidth + " backCanvasHeight = " + backCHeight);
				bcv.drawImage(aImg, 0, 0, backCWidth, backCHeight);

				var max = Math.max(backCWidth, backCHeight);

				var apx = bcv.getImageData(0, 0, backCWidth, backCHeight);
				apx = convertToEqui(apx, backCWidth, backCHeight, 0, 0);
				//console.log(apx.data.length);
				max = Math.max(cWidth, cHeight);
				textureWidth = max;
				textureHeight = max;
				gImage.width = max;
				gImage.height = max;
				gCtxImg = gImage.getContext("2d");
				gCtxImg.clearRect(0, 0, max, max);

				gCtxImg.putImageData(apx, Math.floor((max - cWidth) / 2), Math.floor((max - cHeight) / 2));
				//gCtxImg.drawImage(aImg, 0, 0);
				textureImageData = gCtxImg.getImageData(0, 0, max, max);
				frames++;
				setTimeout(copyImageToBuffer, 0, aImg);
				textureData = textureImageData.data;
			}
		}
	}
function detectSubsampling(img) {
    var iw = img.naturalWidth,
        ih = img.naturalHeight,
        ssCanvas,
        ssCTX;
		
    if (iw * ih > 1024 * 1024) { // Subsampling may happen over megapixel image
        ssCanvas = document.createElement('canvas');
        ssCanvas.width = ssCanvas.height = 1;
        ssCTX = ssCanvas.getContext('2d');
        ssCTX.drawImage(img, -iw + 1, 0);
        // Subsampled image becomes half smaller in rendering size.
        // Check alpha channel value to confirm image is covering edge pixel or not.
        // If alpha value is 0 image is not covering, hence subsampled.
        return ssCTX.getImageData(0, 0, 1, 1).data[3] === 0;
    }
    return false;
}
	var frames = 0;
	function setFOV(fov) {
		//console.log("Changing FOV to " + fov);
		var aspect = cWidth / cHeight;
		FOV = fov;
		ry = 90;
		rz = 180 + opts.turn;
		RY = (270 - ry);
		RZ = (180 - rz);
		vs = fov;
		hs = vs * aspect;
		if (isUnWrappedImage) {
			hs *= 2.5;
		} else {
			hs *= 1.875;
		}
		hhs = 0.5 * hs;
		hvs = 0.5 * vs;
		hs_ch = (hs / cWidth);
		vs_cv = (vs / cHeight);
		r = 100;
		c = F[X] * F[X] + S[X] * S[X] + F[Y] * F[Y] + S[Y] * S[Y] + F[Z] * F[Z] + S[Z] * S[Z] - 2 * (F[X] * S[X] + F[Y] * S[Y] + F[Z] * S[Z]) - r * r;

		c4 = c * 4;
		V[Y] = f;

		b = (2 * (-f * V[Y]));
		b2 = Math.pow(b, 2);
	}

	/*
	 var workersCount = 4;
	 var worker = [new Worker("js/doWork.js"), new Worker("js/doWork.js"), new Worker("js/doWork.js"), new Worker("js/doWork.js")];*/

	var blob = null;
	var errorHandler;
	var finished = 0;
	var onWorkEnded = function(e) {

		var canvasData = e.data.result;
		var index = e.data.index;
		var blockSize = cHeight / workersCount;
		gCtx.putImageData(canvasData, 0, blockSize * index);

		finished++;

		if (finished == workersCount) {
			//var diff = new Date() - start;
			//log.innerHTML = "Process done in " + diff + " ms";
			console.log("Finished");
			finished = 0;
		}
	};

	this.initHTML5 = function(isEqui, textureUrl, textureXMLUrl, canvasWidth, textureResizeWidth, sScreenCache, fScreenCache) {
		//Set parameters functions for EITHER unwrapped(bubblepix) image (A), or Equi Parameters (B) for Equirectangular images
		//Must be set before createSphere is called

		//A: setUnwrappedParameters (uPerpendicular, vPerpendicular, minDiameter, maxDiameter, fov, canvasWidth)
		//B: setEquiParameters(FOV,canvasWidth);
		//window.requestFileSystem(window.TEMPORARY, 1024 * 1024, onInitFs, errorHandler);

		/*
		for (var index = 0; index < workersCount; index++) {

		worker[index].onmessage = onWorkEnded;
		}*/

		//worker.postMessage('Hello World');
		//worker.postMessage("my message");

		if (canvasWidth == 0) {
			canvasWidth = 244;
		}
		if (textureResizeWidth == 0) {
			textureResizeWidth = 2048;
		}

		bubble_details.MAX_WIDTH = textureResizeWidth;

		var isVideo = false;
		var vidIdentifier = ".mp4";
		if (textureUrl.indexOf(vidIdentifier) !== -1)
			isVideo = true;

		isUnWrappedImage = !isEqui;

		//these will be overwritten if there is xml data)
		if (isUnWrappedImage) {
			setUnwrappedParameters(0.54, 0.44, 0.10, 0.5, 18, canvasWidth, isVideo);
		} else {
			setEquiParameters(11, canvasWidth);
		}
		//setEquiParameters(20, 400);
		//create sphere with texture
		createBubble(document.getElementById("bubble"), textureUrl, textureXMLUrl);
		//createBubble(document.getElementById("bubble"), textureUrl, true, textureXMLUrl);
	};

	//need to be global
	var img = undefined;
	var video;
	var backcvs;
	var bcv;
	var xmlData;
	var bcWidth;
	var bcHeight;

	this.createBubble = function(gCanvas, textureUrl, xmlURL) {
		var loadTexture = false;
		if (img === undefined) {
			loadTexture = true;
		}
		gCtx = gCanvas.getContext("2d");
		gCanvas.height = canWidth;
		gCanvas.width = canHeight;

		console.log("width: " + gCanvas.width);

		if (loadTexture) {
			setEventListeners(gCanvas);
			xmlData = loadXML(xmlURL);
		}
		if (xmlData) {
			parseXML(xmlData);
		} else {
			alert("ERROR: Invalid XML Data");
		}

		cHeight = gCanvas.height;
		cWidth = gCanvas.width;
		size = gCanvas.width;
		hs_ch = ((hs) / cWidth);
		vs_cv = ((vs) / (cHeight));

		if (auto_rotate)
			xMovement = 0.000002;

		setFOV(FOV);
		//console.log("canHeight: " + cHeight);
		//console.log("canWidth: " + cWidth);
		if (loadTexture && !isUnWrappedVideo) {
			//loading image for first time
			canvasImageData = gCtx.createImageData(gCanvas.width, gCanvas.height);
			img = new Image();
			img.crossOrigin = "Anonymous";
			img.onload = function() {
				copyImageToBuffer(img);
				earth = sphere(false);
				renderAnimationFrame = function(time) {
					earth.renderFrame(time);
					setTimeout(window.requestAnimationFrame, 10, renderAnimationFrame);
				};
				window.requestAnimationFrame(renderAnimationFrame);
				cancelLoadingScreen();
			};
			img.setAttribute("src", textureUrl);

		} else if (loadTexture && isUnWrappedVideo) {
			//loading video for first time
			canvasImageData = gCtx.createImageData(gCanvas.width, gCanvas.height);
			video = document.getElementsByTagName('video')[0];

			//start video
			var sources = video.getElementsByTagName('source');
			sources[0].src = textureUrl;
			video.load();

			backcvs = document.getElementById('backCanvas');
			copyImageToBuffer(video);
			earth = sphere(false);
			renderAnimationFrame = function(time) {
				earth.renderFrame(time);
				setTimeout(window.requestAnimationFrame, 10, renderAnimationFrame);
			};
			window.requestAnimationFrame(renderAnimationFrame);
			cancelLoadingScreen();

		} else if (!loadTexture && isUnWrappedVideo) {
			//reloading video
			video.load();
			canvasImageData = gCtx.createImageData(gCanvas.width, gCanvas.height);
			copyImageToBuffer(originalImage);
			earth = sphere(false);
			cancelLoadingScreen();
			//window.requestAnimationFrame(renderAnimationFrame);

		} else {
			//reloading image
			canvasImageData = gCtx.createImageData(gCanvas.width, gCanvas.height);
			copyImageToBuffer(originalImage);
			earth = sphere(false);
			cancelLoadingScreen();
			//window.requestAnimationFrame(renderAnimationFrame);

		}

	};

	//convert flash and webgl params to html5
	function convertToWebPlayerParams() {

		
		bubble_details.uPerp = xml_details.cY;
		bubble_details.vPerp = 1 - xml_details.cX;
		console.log("uPerp: " + bubble_details.uPerp);
		console.log("vPerp: " + bubble_details.vPerp);
		bubble_details.maxDiam = xml_details.height;
		bubble_details.minDiam = xml_details.innerCircle * bubble_details.maxDiam;

	}

	function loadXML(xml) {
		var xhttp;
		if (window.XMLHttpRequest) {
			//console.log("New HTTP Request " + xml);
			xhttp = new XMLHttpRequest();

		} else {
			//console.log("New ActiveX Request");
			xhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}

		xhttp.open("GET", xml, false);
		//console.log("sending");
		try {
			xhttp.send(null);
			return xhttp.responseXML;
		} catch(e) {
			alert("ERROR: XML request failed.\n" + e);
			return false;
		}
		//console.log("sent");

	}

	//bubble interaction specific variables
	var bubbleCanvas;
	var textureClampHeight;
	var auto_rotate = true;
	var isUserInteracting = false;
	var isLeftInteracting = false;
	var isRightInteracting = false;
	var isStopInteracting = false;
	var isStartInteracting = false;
	var pressStartButton = false;
	var pressStopButton = false;
	var isFullScreen = false;
	var onMouseDownEventX = 0;
	var onMouseDownEventY = 0;
	var eventMouseX = 0;
	var eventMouseY = 0;
	var xMovement = 0;
	var yMovement = 0;
	var zoom = 0;
	var FOV = 20;
	var originalCanWidth = 200;
	var canWidth = originalCanWidth;
	var canHeight = originalCanWidth * 2;
	var originalImage = undefined;

	var isUnWrappedImage = false;
	var isUnWrappedVideo = false;

	function setEventListeners(canvas) {
		bubbleCanvas = canvas;
		bubbleCanvas.addEventListener("mousedown", mouseDownEvent, false);
		bubbleCanvas.addEventListener("mouseup", mouseUpEvent, false);
		bubbleCanvas.addEventListener("mousemove", mouseMoveEvent, false);
		bubbleCanvas.addEventListener("mouseout", mouseOutEvent, false);
		bubbleCanvas.addEventListener("touchstart", mouseDownEvent, false);
		bubbleCanvas.addEventListener("touchend", mouseUpEvent, false);
		bubbleCanvas.addEventListener("touchmove", mouseMoveEvent, false);
		document.addEventListener("mouseup", mouseUpEvent, false);
		if (!isUnWrappedImage) {
			bubbleCanvas.addEventListener('mousewheel', mouseScrollEvent, false);
			bubbleCanvas.addEventListener('DOMMouseScroll', mouseScrollEvent, false);
		}

		var el = document.getElementById("fullscreen");

		if (el.addEventListener) {
			el.addEventListener("click", fullScreenButtonClick, false);
		} else if (el.attachEvent) {
			el.attachEvent('onclick', fullScreenButtonClick);
			////console.log(el + " 2");
		}
		el = null;

		/*
		 var el = document.getElementById("fullscreen_off");

		 if (el.addEventListener) {
		 el.addEventListener("click", fullScreenButtonClick, false);
		 } else if (el.attachEvent) {
		 el.attachEvent('onclick', fullScreenButtonClick);
		 ////console.log(el + " 2");
		 }
		 el = null;

		 el = document.getElementById("rotate");

		 if (el.addEventListener) {
		 el.addEventListener("click", toggleRotateButtonClick, false);
		 } else if (el.attachEvent) {
		 el.attachEvent('onclick', toggleRotateButtonClick);
		 ////console.log(el + " 2");
		 }
		 el = null;

		 el = document.getElementById("rotate_off");

		 if (el.addEventListener) {
		 el.addEventListener("click", toggleRotateButtonClick, false);
		 } else if (el.attachEvent) {
		 el.attachEvent('onclick', toggleRotateButtonClick);
		 ////console.log(el + " 2");
		 }*/

		el = null;

		//$(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange',fullscreenChanged);

	}

	function cancelLoadingScreen() {
		//document.getElementById("loading").style.display = 'none';
	}

	function showLoadingScreen() {
		//document.getElementById("loading").style.display = '';
	}

	function toggleRotateButtonClick() {
		auto_rotate = !auto_rotate;

		if (auto_rotate) {
			xMovement = 0.000002;
			document.getElementById("rotate").style.display = 'block';
			document.getElementById("rotate_off").style.display = 'none';
		} else {
			xMovement = 0;
			document.getElementById("rotate").style.display = 'none';
			document.getElementById("rotate_off").style.display = 'block';
		}
	}

	var fs_state = "";
	//var ignore_once = false;
	/*

	 $(window).resize(function() {//when the browser size change
	 //if FS is active
	 fs_state = typeof (document.webkitIsFullScreen) == "undefined" ? document.webkitIsFullScreen : document.mozFullScreen;
	 //ignore_once = !ignore_once; //event is called 2 times per fullscreen
	 //(don't know why), so i ignore once
	 //console.log("fullscreen: " + fs_state);

	 switch(fs_state) {
	 case true:
	 console.log("fullscreen yes");
	 fullScreenButtonClick();
	 break;

	 case false:
	 console.log("fullscreen no");
	 fullScreenButtonClick();
	 break;
	 }
	 });*/

	function fullScreenButtonClick() {
		timerStart = new Date().getTime();
		showLoadingScreen();
		if (isFullScreen) {
			var el = document.getElementById("bubbleViewer");

			document.getElementById("fullscreen").style.display = 'block';
			//document.getElementById("fullscreen_off").style.display = 'none';

			el.style.height = "244px";
			el.style.width = "610px";
			canWidth = originalCanWidth;
			canHeight = originalCanWidth * 2;
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
			//el = null;
		} else {

			var el = document.getElementById("bubbleViewer");

			document.getElementById("fullscreen").style.display = 'none';
			//document.getElementById("fullscreen_off").style.display = 'block';
			//
			if (el.requestFullScreen) {
				el.requestFullScreen();
			} else if (el.mozRequestFullScreen) {
				el.mozRequestFullScreen();
			} else if (el.webkitRequestFullScreen) {
				el.webkitRequestFullScreen();
			}

			el.style.height = "100%";
			el.style.width = "100%";

			//double or treble canvas width and height for full screen
			canWidth *= 2;
			//height must be double the width
			canHeight = canWidth * 2.6;
			//setFullScreen
			//el = null;
		}
		isFullScreen = !isFullScreen;
		reload();
	}

	function reload() {
		console.log("reloading");
		createBubble(document.getElementById("bubble"), "", "");
	}

	var mouseIsDown = false;
	function mouseDownEvent(event) {
		event.preventDefault();
		mouseIsDown = true;
		if (event.touches != undefined) {
			eventMouseX = event.touches[0].clientX;
			eventMouseY = event.touches[0].clientY;
		} else {
			eventMouseX = event.clientX;
			eventMouseY = event.clientY;
		}
		//eventMouseY = event.clientY;
		isUserInteracting = true;

		if (event.touches != undefined) {
			onMouseDownEventX = event.touches[0].clientX;
			onMouseDownEventY = event.touches[0].clientY;
		} else {
			onMouseDownEventX = event.clientX;
			onMouseDownEventY = event.clientY;
		}

		//onMouseDownEventX = event.clientX;
		//onMouseDownEventY = event.clientY;
	}

	function mouseUpEvent(event) {
		isUserInteracting = false;
		mouseIsDown = false;
		if (event.touches != undefined) {
			eventMouseX = eventMouseX;
			eventMouseY = eventMouseY;
		} else {
			eventMouseX = event.clientX;
			eventMouseY = eventMouseY;
		}
		yRot += yMovement;
		xMovement = 0;
		yMovement = 0;

		if (auto_rotate)
			xMovement = 0.000002;
	}

	var yaya = 0;
	function YClamp(y) {
		return Math.floor(y);
	}

	function mouseOutEvent(event) {
		event.preventDefault();
		if (event.touches != undefined) {
			eventMouseX = event.touches[0].clientX;
			eventMouseY = event.touches[0].clientY;
		} else {
			eventMouseX = event.clientX;
			eventMouseY = event.clientY;
		}
	}

	var yRotVal = 0;
	function mouseMoveEvent(event) {
		event.preventDefault();
		if (isUserInteracting) {
			if (event.touches != undefined) {
				eventMouseX = event.touches[0].clientX;
				eventMouseY = event.touches[0].clientY;
			} else {
				eventMouseX = event.clientX;
				eventMouseY = event.clientY;
			}
			//eventMouseY = event.clientY;
			yMovement = ~~((onMouseDownEventY - eventMouseY) / 2);
			// / 20000000;
			xMovement = (onMouseDownEventX - eventMouseX) / 2500000;

			if (auto_rotate)
				xMovement += 0.000002;

			//yMovement = (onMouseDownEventY - eventMouseY);
			yRotVal = yMovement + yRot;

		}
	}

	var lastLegitYRot = 0;
	var failedBottomY = false;
	var failedTopY = false;
	var failedBottomYValue = 0;
	var failedTopYValue = 0;
	function isLegitYRot() {
		//bottom
		{
			var threshold = 0.1;
			var pixel = cWidth * cHeight;
			var total = 0;
			var testPixels = (cWidth * cHeight) - (cWidth * (cHeight - 1));
			//console.log("Testing " + testPixels + " (from " + pixel + " to " + ((cWidth * cHeight) - testPixels) + ")");
			while (pixel-- && pixel > (cWidth * cHeight) - testPixels) {

				var idxC = ~~(pixel * 4);

				if (canvasData[idxC + 0] == 0 && canvasData[idxC + 1] == 0 && canvasData[idxC + 2] == 0 && canvasData[idxC + 3] == 0)
					total++;

				/*
				 //early fail check
				 if (idxC % 300 == 0) {
				 var result = total / testPixels * 100;
				 //console.log("result: " + result);
				 if (result > threshold) {
				 failedBottomY = true;
				 failedBottomYValue = yRotVal;
				 failedTopY = false;
				 return false;
				 }
				 }*/

			}

			var result = total / testPixels * 100;
			//console.log("result: " + result);
			if (result > threshold) {
				failedBottomY = true;
				failedBottomYValue = yRotVal;
				failedTopY = false;
				return false;
			} else {
				//return true;
				failedBottomY = false;
				failedTopY = false;
			}
		}

		//top
		{
			var threshold = 0.1;
			var pixel = 0;
			var total = 0;
			var testPixels = (cWidth * (1));
			var index = 0;
			while (pixel < testPixels) {

				index++;
				var idxC = ~~(pixel * 4);
				pixel++;
				if (canvasData[idxC + 0] == 0 && canvasData[idxC + 1] == 0 && canvasData[idxC + 2] == 0 && canvasData[idxC + 3] == 0)
					total++;

				/*
				 //early fail check
				 if (idxC % 300 == 0) {
				 var result = total / testPixels * 100;
				 //console.log("result: " + result);
				 if (result > threshold) {
				 failedBottomY = false;
				 failedTopY = true;
				 failedTopYValue = yRotVal;
				 return false;
				 }
				 }*/

			}
			var result = total / testPixels * 100;
			if (result > threshold) {
				failedBottomY = false;
				failedTopY = true;
				failedTopYValue = yRotVal;
				return false;
			} else {
				//return true;
				failedBottomY = false;
				failedTopY = false;
			}
		}
		return true;
	}

	function mouseScrollEvent(event) {
		if (event.wheelDeltaY) {
			if (event.wheelDeltaY < 0 && FOV < 21)
				setFOV(34);
			else if (event.wheelDeltaY > 0 && FOV > 33)
				setFOV(20);
			// Opera / Explorer 9
		} else if (event.wheelDelta) {
			if (event.wheelDelta > 0 && FOV < 21)
				setFOV(34);
			else if (event.detail < 0 && FOV > 33)
				setFOV(20);
			// Firefox
		} else if (event.detail) {
			if (event.detail > 0 && FOV < 21)
				setFOV(34);
			else if (event.detail < 0 && FOV > 33)
				setFOV(20);
		}
	}


	this.setUnwrappedParameters = function(uPerpendicular, vPerpendicular, minDiameter, maxDiameter, fov, canvasWidth, isVideo) {
		FOV = fov;
		bubble_details.uPerp = uPerpendicular;
		bubble_details.vPerp = vPerpendicular;
		bubble_details.minDiam = minDiameter;
		bubble_details.maxDiam = maxDiameter;
		originalCanWidth = canvasWidth;
		canWidth = canvasWidth;
		canHeight = canWidth * 2;
		isUnWrappedVideo = isVideo;
	};

	this.setEquiParameters = function(fov, canvasWidth) {
		FOV = fov;
		originalCanWidth = canvasWidth;
		canWidth = canvasWidth;
		canHeight = canWidth * 2;
	};

	function parseXML(xml) {
		if (isUnWrappedImage) {
			xml_details.cX = parseFloat(xml.getElementsByTagName('play_objects')[0].getElementsByTagName('crop')[0].getAttribute('cx'));
			xml_details.cY = parseFloat(xml.getElementsByTagName('play_objects')[0].getElementsByTagName('crop')[0].getAttribute('cy'));
			//xml_details.cX = 1 - xml_details.cX;
			xml_details.innerCircle = parseFloat(xml.getElementsByTagName('play_objects')[0].getElementsByTagName('crop')[0].getAttribute('inner_circle'));
			xml_details.width = parseFloat(xml.getElementsByTagName('play_objects')[0].getElementsByTagName('crop')[0].getAttribute('width'));
			xml_details.height = parseFloat(xml.getElementsByTagName('play_objects')[0].getElementsByTagName('crop')[0].getAttribute('height'));

			convertToWebPlayerParams();
		} else {

			bubble_details.minDiam = parseFloat(xml.getElementsByTagName('play_objects')[0].getElementsByTagName('crop')[0].getAttribute('width'));
			;
			bubble_details.maxDiam = parseFloat(xml.getElementsByTagName('play_objects')[0].getElementsByTagName('crop')[0].getAttribute('height'));
		}

		var initStartString = xml.getElementsByTagName("play_objects")[0].getElementsByTagName('auto')[0].getAttribute('init_start');

		if (initStartString == 'yes') {
			auto_rotate = true;
			// document.getElementById("rotate").style.display = 'block';
			//document.getElementById("rotate_off").style.display = 'none';
		} else {
			auto_rotate = false;
			// document.getElementById("rotate").style.display = 'none';
			// document.getElementById("rotate_off").style.display = 'block';
		}

	}
	
	
  /**
   * Rendering image element (with resizing) into the canvas element
   */
   function detectVerticalSquash(img, iw, ih) {
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = ih;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var data = ctx.getImageData(0, 0, 1, ih).data;
    // search image edge pixel position in case it is squashed vertically.
    var sy = 0;
    var ey = ih;
    var py = ih;
    while (py > sy) {
      var alpha = data[(py - 1) * 4 + 3];
      if (alpha === 0) {
        ey = py;
      } else {
        sy = py;
      }
      py = (ey + sy) >> 1;
    }
    var ratio = (py / ih);
    return (ratio===0)?1:ratio;
  }

	
}).call(this);

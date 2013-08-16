    var videoTexture;
    var camera, controls;
    var isUserInteracting = false;
    var isLeftInteracting = false;
    var isRightInteracting = false;
    var isStopInteracting = false;
    var isStartInteracting = false;
    var pressStartButton = false;
    var pressStopButton = false;
    var isFullScreen = false;
    var onMouseDownMouseX = 0;
    var onMouseUpmouseY = 0;
    var eventMouseX = 0;
    var eventMouseY = 0;
    var isEquirectangle;
    var leftMouseover, rightMouseover, stopMouseover, startMouseover , logoMouseover, hotspotMouseover, displayMouseover = false;
    var windowHeight;
    var windowWidth;
    var hotspots = new Array();

    function loadXMLDoc(dname)
    {
        if (window.XMLHttpRequest)
            xhttp=new XMLHttpRequest();
        else
            xhttp=new ActiveXObject("Microsoft.XMLHTTP");

        xhttp.open("GET",dname,false);
        xhttp.send();
        return xhttp.responseXML;
    }

    var getElementPosition = function(element) {
		var top = left = 0;
        if(!isFullScreen){
            do {
                top  += element.offsetTop  || 0;
                left += element.offsetLeft || 0;
                element =  element.offsetParent;
            }
            while (element);
        }   

        return {top: top, left: left};
    }

     window.requestAnimFrame = (function(callback){
            return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback){
            window.setTimeout(callback, 1000 / 30); //60fps
        };
    })();

    function getHotspots(xml){

        var hotspotsXML = xml.getElementsByTagName('hotspot');

        for (var i = 0; i < hotspotsXML.length; i++) {
            var bornes = hotspotsXML[i].getElementsByTagName('bornes')[0];
            var logo = hotspotsXML[i].getElementsByTagName('logo')[0];
            var action = hotspotsXML[i].getElementsByTagName('action')[0].childNodes[0].nodeValue;

            var hotspot = {
                bornes : bornes,
                logo : logo,
                action : action
            };

            hotspots.push(hotspot);
        };
        
    }
    

    function init(equirectangle, image, xml) {

            isEquirectangle = equirectangle;

            var xmlDoc=loadXMLDoc(xml);
            getHotspots(xmlDoc);

            var cx = parseFloat(xmlDoc.getElementsByTagName('play_objects')[0].getElementsByTagName('crop')[0].getAttribute('cx'));
            var cy = parseFloat(xmlDoc.getElementsByTagName('play_objects')[0].getElementsByTagName('crop')[0].getAttribute('cy'));

            var angularSpeed = 0.05; // revolutions per second
            var lastTime = 0;
            var fov = 130;

            var container = document.getElementById( 'container' );
            var fullScreenContainer = document.getElementById( 'fullScreenContainer' );
            var projector = new THREE.Projector();
            // renderer
            var renderer = new THREE.WebGLRenderer();
            renderer.setSize(610, 250);
            container.appendChild( renderer.domElement );

            //It's the better aspect for equirectangle image
            var aspect = window.innerWidth / (window.innerHeight*3);

            // camera
            if(isEquirectangle){
                var camera = new THREE.PerspectiveCamera(130, aspect, 1, 10000 );
                camera.target = new THREE.Vector3( 0, 0, 0 );
                camera.position.z = 0;
            }else{
                var camera = new THREE.PerspectiveCamera(45, window.innerWidth / (window.innerHeight/2), 1, 10000); //fov, aspect, near, far
                camera.position.z = 0;
            }
            
            // scene
            var scene = new THREE.Scene();

            //Logo
            var logo = new THREE.Mesh( new THREE.PlaneGeometry(18,12), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'html5still_files/object_images/logo.png' ), transparent: true } ) );

            //Button left
            var left_bt = new THREE.Mesh( new THREE.PlaneGeometry(9,6), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'html5still_files/object_images/left01.png' ), transparent: true } ) );
            var left_bt2 = new THREE.Mesh( new THREE.PlaneGeometry(10,6), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'html5still_files/object_images/left02.png' ), transparent: true } ) );

            //Button rigth
            var right_bt = new THREE.Mesh( new THREE.PlaneGeometry(9,6), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'html5still_files/object_images/right01.png' ), transparent: true } ) );
            var right_bt2 = new THREE.Mesh( new THREE.PlaneGeometry(10,6), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'html5still_files/object_images/right02.png' ), transparent: true } ) );

            //Button stop
            var stop_bt = new THREE.Mesh( new THREE.PlaneGeometry(9,6), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'html5still_files/object_images/auto_stop01.png' ), transparent: true } ) );
            var stop_bt2 = new THREE.Mesh( new THREE.PlaneGeometry(10,6), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'html5still_files/object_images/auto_stop02.png' ), transparent: true } ) );

            //Button start
            var start_bt = new THREE.Mesh( new THREE.PlaneGeometry(9,6), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'html5still_files/object_images/auto_start01.png' ), transparent: true } ) );
            var start_bt2 = new THREE.Mesh( new THREE.PlaneGeometry(10,6), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'html5still_files/object_images/auto_start02.png' ), transparent: true } ) );

            //Button display
            var display_bt = new THREE.Mesh( new THREE.PlaneGeometry(9,6), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'html5still_files/object_images/display01.png' ), transparent: true } ) );
            var display_bt2 = new THREE.Mesh( new THREE.PlaneGeometry(10,6), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'html5still_files/object_images/display02.png' ), transparent: true } ) );

            // material            
            var stillMaterial = new THREE.MeshLambertMaterial({
                map: THREE.ImageUtils.loadTexture(image)
            }); 

				video = document.getElementById( 'video' );

				texture = new THREE.Texture( video );
				texture.minFilter = THREE.LinearFilter;
				texture.magFilter = THREE.LinearFilter;

				var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: true } );

				// sphere
				//

                var  global = new THREE.Object3D();


				if(isEquirectangle)
				{
					var sphere = new THREE.Mesh( new THREE.SphereGeometry(true, 1000, 64, 500), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( image ), side : THREE.DoubleSide } ) );
					sphere.scale.x = -1;
				}
				else{
					var sphere = new THREE.Mesh(new THREE.SphereGeometry(false, 200, 64, 32, 1.3+cy, Math.PI/3, 0.18+cx, Math.PI, cx, cy), stillMaterial); //isEquirectanle, radius, segments, rings, phiStart, phiLength, thetaStart, thetaLength
				}

            sphere.overdraw = true;
            global.add(sphere);

            //Hotspot
            for (var i = 0; i < hotspots.length; i++) {
                var hotspotLogo = new THREE.Mesh( new THREE.PlaneGeometry(9,6), new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'html5still_files/object_images/hotspot.png' ), transparent: true } ) );
                hotspotLogo.position.set(hotspots[i].logo.getAttribute('x'), hotspots[i].logo.getAttribute('y'), hotspots[i].logo.getAttribute('z'));
                hotspotLogo.scale.x = hotspotLogo.scale.y = 2;

                global.add( hotspotLogo );
            };      
            
            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;

            objectPosition();

            scene.add(logo);
            scene.add(left_bt);
            scene.add(right_bt);
            scene.add(stop_bt);
            scene.add(display_bt);
            scene.add(global);

            // add full ambient lighting
            var ambientLight = new THREE.AmbientLight(0xffffff);
            scene.add(ambientLight);


            // create wrapper object that contains three.js objects
            var three = {
                renderer: renderer,
                camera: camera,
                scene: scene,
                sphere: sphere,
                projector : projector,
                logo: logo,
                global: global
            };

            var player = {
                left_bt: left_bt,
                left_bt2: left_bt2,
                right_bt: right_bt,
                right_bt2: right_bt2,
                stop_bt: stop_bt,
                stop_bt2: stop_bt2,
                start_bt: start_bt,
                start_bt2: start_bt2,
                display_bt: display_bt,
                display_bt2: display_bt2
            };


            //Add mouse controls
            renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
            renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
            document.addEventListener( 'mouseup', onDocumentMouseUp, false );
            if(isEquirectangle){
                document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
                document.addEventListener( 'DOMMouseScroll', onDocumentMouseWheel, false);
            }
            document.addEventListener("webkitfullscreenchange", function() {
               if(isFullScreen){
                cancelFullScreen();
                isFullScreen = false;
               }
               else{
                window.moveTo(0,0);
                fullScreen();
                isFullScreen = true;
                }
            }, false);
            document.addEventListener("mozfullscreenchange", function() {
               if(isFullScreen){
                cancelFullScreen();
                isFullScreen = false;
               }else{
                fullScreen();
                isFullScreen = true;
                }
            }, false); 


            function onDocumentMouseWheel( event ) {
                // WebKit
                var zoom=0;

                if ( event.wheelDeltaY ) {
                    if(event.wheelDeltaY < 0 && fov < 148)
                        zoom = 6;
                    else if (event.wheelDeltaY > 0 && fov > 118)
                        zoom=-6;
                // Opera / Explorer 9
                } else if ( event.wheelDelta ) {
                    if(event.wheelDelta > 0 && fov < 148)
                       zoom = 6;
                    else if (event.detail < 0 && fov > 118)
                        zoom = -6;           
                // Firefox
                } else if ( event.detail ) {           
                    if(event.detail > 0 && fov < 148)
                       zoom = 6;
                    else if (event.detail < 0 && fov > 118)
                      zoom = -6;
                }

                if(zoom > 0){
                        logo.position.z += (windowWidth/windowHeight) * 1.7;
                        left_bt.position.z += (windowWidth/windowHeight) * 1.7;
                        right_bt.position.z += (windowWidth/windowHeight) * 1.7;
                        start_bt.position.z += (windowWidth/windowHeight) * 1.7;
                        stop_bt.position.z += (windowWidth/windowHeight) * 1.7;
                        display_bt.position.z += (windowWidth/windowHeight) * 1.7;
                }
                else if( zoom < 0){
                        logo.position.z -= (windowWidth/windowHeight) * 1.7;
                        left_bt.position.z -= (windowWidth/windowHeight) * 1.7;
                        right_bt.position.z -= (windowWidth/windowHeight) * 1.7;
                        start_bt.position.z -= (windowWidth/windowHeight) * 1.7;
                        stop_bt.position.z -= (windowWidth/windowHeight) * 1.7;
                        display_bt.position.z -= (windowWidth/windowHeight) * 1.7;
                }
                fov += zoom;
                three.camera.projectionMatrix.makePerspective( fov, aspect, 1, 1100 );
                three.renderer.render();

            } 

            
            
            function onDocumentMouseDown( event ) {

                event.preventDefault();
                isUserInteracting = true;
                onMouseDownMouseX = event.clientX;
                onMouseDownMouseY = event.clientY;
                eventMouseX = event.clientX;
                eventMouseY = event.clientY;
                document.body.style.cursor = 'move';

                var mouseX = event.clientX - getElementPosition(renderer.domElement).left;
                var mouseY = event.clientY - getElementPosition(renderer.domElement).top;
                var x =   (mouseX / renderer.domElement.width) * 2 - 1;
                var y = - (mouseY / renderer.domElement.height) * 2 + 1;
                var vector = new THREE.Vector3(x, y, 1);
                projector.unprojectVector(vector, camera);

                var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());


                if(ray.intersectObject(three.logo).length > 0){
                    window.open("https://bubblepix.com/");
                }

                //Hotspot click
                var intersect = ray.intersectObject(three.sphere);

                if(intersect.length > 0){

					//For obtain coordinates bornes
                    //console.log(intersect[ 0 ].face.normal);

                    //For obtain coordinate hotspot logo
                    //console.log(intersects[ 0 ].point);
                    
                    for (var i = 0; i < hotspots.length; i++) {
                        var hotspot = hotspots[i];
                        //Check hotspot bornes
                        if(intersect[ 0 ].face.normal.x >= hotspot.bornes.getAttribute('minX') && intersect[ 0 ].face.normal.x <= hotspot.bornes.getAttribute('maxX')
                     && intersect[ 0 ].face.normal.y >= hotspot.bornes.getAttribute('minY') && intersect[ 0 ].face.normal.y <= hotspot.bornes.getAttribute('maxY')
                     && intersect[ 0 ].face.normal.z >= hotspot.bornes.getAttribute('minZ') && intersect[ 0 ].face.normal.z <= hotspot.bornes.getAttribute('maxZ')){

                            eval(hotspot.action);
                            isUserInteracting = false;
                        }
                    };

                }

                if(ray.intersectObject(player.left_bt).length > 0 && !isRightInteracting){
                    isLeftInteracting = true;
                    player.left_bt2.position.y -= 1;
                }

                if(ray.intersectObject(player.right_bt).length > 0 && !isLeftInteracting){
                    isRightInteracting = true;
                    player.right_bt2.position.y -= 1;
                }

                if(ray.intersectObject(player.stop_bt).length > 0 && !isStopInteracting){
                    isStopInteracting = true;
                    pressStopButton = true;
                }

                if(ray.intersectObject(player.start_bt).length > 0 && !isStartInteracting){
                    isStartInteracting = true;
                    pressStartButton = true;
                }

                if(ray.intersectObject(player.display_bt).length > 0){
                
                if(!isFullScreen){             
                    if (!fullScreenContainer.fullscreenElement &&    // alternative standard method
                         !fullScreenContainer.mozFullScreenElement && !fullScreenContainer.webkitFullscreenElement) {  // current working methods
                        if (fullScreenContainer.requestFullscreen) {
                          fullScreenContainer.requestFullscreen();
                        } else if (fullScreenContainer.mozRequestFullScreen) {
                          fullScreenContainer.mozRequestFullScreen();
                        } else if (fullScreenContainer.webkitRequestFullscreen) {
                          fullScreenContainer.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                        }
                      }
                    }else{

                        cancelFullScreen();

                       if (fullScreenContainer.cancelFullScreen) {
                          document.cancelFullScreen();
                        } else if (document.mozCancelFullScreen) {
                          document.mozCancelFullScreen();
                        } else if (document.webkitCancelFullScreen) {
                          document.webkitCancelFullScreen();
                        }

                    }

                        
                }

                renderer.render( scene, camera );


            }

            function fullScreen(){    
                if(isEquirectangle){
                    fov = 130;
                    three.camera.projectionMatrix.makePerspective( fov, aspect, 1, 1100 );
                }   

			   isLeftInteracting = false;
                isRightInteracting = false;
                isUserInteracting = false;
                 
                 renderer.setSize(window.innerWidth, window.innerHeight);
                fullScreenContainer.appendChild( renderer.domElement );
                 objectPositionFullScreen();


            }

            function cancelFullScreen(){

                if(isEquirectangle){
                        fov = 130;
                        three.camera.projectionMatrix.makePerspective( fov,aspect, 1, 1100 );
                    }

                isLeftInteracting = false;
                isRightInteracting = false;
                isUserInteracting = false;
                renderer.setSize(610, 250);

                three.logo.scale.x= 1;
                three.logo.scale.y = 1;
				container.appendChild( renderer.domElement );

                objectPosition();
                }

            function objectPosition(){

                 if(isEquirectangle){
                    var scaleX = (windowWidth/windowHeight)/6;
                    var scaleY = 2;

                    logo.scale.x = scaleX;
                    logo.scale.y = scaleY;

                    logo.position.set(-16*(windowWidth/windowHeight),38,-25);

                    left_bt.scale.x = scaleX;
                    left_bt.scale.y = scaleY;

                    left_bt2.scale.x = scaleX;
                    left_bt2.scale.y = scaleY;

                    left_bt.position.set(14*(windowWidth/windowHeight),-48, -25);
                    left_bt2.position = left_bt.position;

                    right_bt.scale.x = scaleX;
                    right_bt.scale.y = scaleY;

                    right_bt2.scale.x = scaleX;
                    right_bt2.scale.y = scaleY;

                    right_bt.position.set(15.5*(windowWidth/windowHeight),-48,-25);
                    right_bt2.position = right_bt.position;

                    stop_bt.scale.x = scaleX;
                    stop_bt.scale.y = scaleY;

                    stop_bt2.scale.x = scaleX;
                    stop_bt2.scale.y = scaleY;

                    stop_bt.position.set(12.5*(windowWidth/windowHeight),-48,-25);
                    stop_bt2.position = stop_bt.position;

                    start_bt.scale.x = scaleX;
                    start_bt.scale.y = scaleY;

                    start_bt2.scale.x = scaleX;
                    start_bt2.scale.y = scaleY;

                    start_bt.position.set(12.5*(windowWidth/windowHeight),-48,-25);
                    start_bt2.position = start_bt.position;

                    display_bt.scale.x = scaleX;
                    display_bt.scale.y = scaleY;

                    display_bt2.scale.x = scaleX;
                    display_bt2.scale.y = scaleY;

                    display_bt.position.set(17*(windowWidth/windowHeight),-48,-25);
                    display_bt2.position = display_bt.position;

                }else{

                    var scaleX = (windowWidth/windowHeight)/2.5;
                    var scaleY = 0.7;

                    logo.scale.x = scaleX;
                    logo.scale.y = 0.8;
                    logo.position.set(-37*(windowWidth/windowHeight),15,-50);


                    left_bt.scale.x = scaleX;
                    left_bt.scale.y = scaleY;

                    left_bt2.scale.x = scaleX;
                    left_bt2.scale.y = scaleY;

                    left_bt.position.set(34*(windowWidth/windowHeight),-18.5, -50);
                    left_bt2.position = left_bt.position;

                    right_bt.scale.x = scaleX;
                    right_bt.scale.y = scaleY;

                    right_bt2.scale.x = scaleX;
                    right_bt2.scale.y = scaleY;

                    right_bt.position.set(37*(windowWidth/windowHeight),-18.5,-50);
                    right_bt2.position = right_bt.position;

                    stop_bt.scale.x = scaleX;
                    stop_bt.scale.y = scaleY;

                    stop_bt2.scale.x = scaleX;
                    stop_bt2.scale.y = scaleY;

                    stop_bt.position.set(31*(windowWidth/windowHeight),-18.5,-50);
                    stop_bt2.position = stop_bt.position;

                    start_bt.scale.x = scaleX;
                    start_bt.scale.y = scaleY;

                    start_bt2.scale.x = scaleX;
                    start_bt2.scale.y = scaleY;

                    start_bt.position.set(31*(windowWidth/windowHeight),-18.5,-50);
                    start_bt2.position = start_bt.position;

                    display_bt.scale.x = scaleX;
                    display_bt.scale.y = scaleY;

                    display_bt2.scale.x = scaleX;
                    display_bt2.scale.y = scaleY;

                    display_bt.position.set(40*(windowWidth/windowHeight),-18.5,-50);
                    display_bt2.position = display_bt.position;
                    
                }
                
            }

            function objectPositionFullScreen(){

                if(isEquirectangle){

                    var scaleX = (windowWidth/windowHeight)/9;
                    var step = (windowWidth/windowHeight)/0.9;

                    logo.scale.x = scaleX;
                    logo.scale.y = 1;

                    logo.position.set(-16.5*(windowWidth/windowHeight),47,-25);

                    left_bt.scale.x = scaleX;
                    left_bt.scale.y = 1;

                    left_bt2.scale.x = scaleX;
                    left_bt2.scale.y = 1;

                    left_bt.position.set(-step,-50, -25);
                    left_bt2.position = left_bt.position;

                    right_bt.scale.x = scaleX;
                    right_bt.scale.y = 1;

                    right_bt2.scale.x = scaleX;
                    right_bt2.scale.y = 1;

                    right_bt.position.set(0,-50,-25);
                    right_bt2.position = right_bt.position;

                    stop_bt.scale.x = scaleX;
                    stop_bt.scale.y = 1;

                    stop_bt2.scale.x = scaleX;
                    stop_bt2.scale.y = 1;

                    stop_bt.position.set(-(2*step),-50,-25);
                    stop_bt2.position = stop_bt.position;

                    start_bt.scale.x = scaleX;
                    start_bt.scale.y = 1;

                    start_bt2.scale.x = 0.2;
                    start_bt2.scale.y = 1;

                    start_bt.position.set(-(2*step),-50,-25);
                    start_bt2.position = start_bt.position;

                    display_bt.scale.x = scaleX;
                    display_bt.scale.y = 1;

                    display_bt2.scale.x = scaleX;
                    display_bt2.scale.y = 1;

                    display_bt.position.set(step,-50,-25);
                    display_bt2.position = display_bt.position;

                }else{
                    var scaleX = (windowWidth/windowHeight)/1.77;
                    var scaleY = 1;

                    var step = (windowWidth/windowHeight)/0.177;
                    
                    logo.scale.x = (windowWidth/windowHeight)/3;
                    logo.scale.y = 0.5;


                    logo.position.set(-70*(windowWidth/windowHeight),33,-90);

                    left_bt.scale.x = scaleX;
                    left_bt.scale.y = scaleY;

                    left_bt2.scale.x = scaleX;
                    left_bt2.scale.y = scaleY;

                    left_bt.position.set(-step,-58,-150);

                    right_bt.scale.x = scaleX;
                    right_bt.scale.y = scaleY;

                    right_bt2.scale.x = scaleX;
                    right_bt2.scale.y = scaleY;

                    right_bt.position.set(0,-58,-150);

                    stop_bt.scale.x = scaleX;
                    stop_bt.scale.y = scaleY;

                    stop_bt2.scale.x = scaleX;
                    stop_bt2.scale.y = scaleY;

                    stop_bt.position.set(-(2*step),-58,-150);

                    start_bt.scale.x = scaleX;
                    start_bt.scale.y = scaleY;

                    start_bt2.scale.x = scaleX;
                    start_bt2.scale.y = scaleY;

                    start_bt.position = stop_bt.position;
                    start_bt2.position = stop_bt.position;

                    display_bt.scale.x = scaleX;
                    display_bt.scale.y = scaleY;

                    display_bt2.scale.x = scaleX;
                    display_bt2.scale.y = scaleY;

                    display_bt.position.set(step,-58,-150);

                }

            }

            
            function onDocumentMouseMove( event ) {

                    eventMouseX = event.clientX;
                    eventMouseY = event.clientY;

                
            }

            function onDocumentMouseUp( event ) {

                isUserInteracting = false;
                if(isLeftInteracting){ 
                    isLeftInteracting = false;
                    player.left_bt2.position.y += 1; 

                }

                if(isRightInteracting){ 
                    isRightInteracting = false;
                    player.right_bt2.position.y += 1;
                }
                
                eventMouseX = 0;
                eventMouseY = 0;
                onMouseDownMouseX = 0;
                onMouseDownMouseY = 0;
                document.body.style.cursor = 'default';

            }
            
            /*
             * wait for texture image to load before
             * starting the animation
             */ 
             var textureImg = new Image();
             textureImg.onload = function(){
                animate(lastTime, angularSpeed, three, player);
            };
            textureImg.src = image;

        }
      

    function animate(lastTime, angularSpeed, three, player){

              // update
              var date = new Date();
              var time = date.getTime();
              var timeDiff = time - lastTime;
              var angleChange = angularSpeed * timeDiff * 2 * Math.PI / 1000;

            //Check mouseover
            var mouseX = eventMouseX - getElementPosition(three.renderer.domElement).left;
            var mouseY = eventMouseY - getElementPosition(three.renderer.domElement).top;
            var x =   (mouseX / three.renderer.domElement.width) * 2 - 1;
            var y = - (mouseY / three.renderer.domElement.height) * 2 + 1;
            var vector = new THREE.Vector3(x, y, 1);
            three.projector.unprojectVector(vector, three.camera);

            var ray = new THREE.Raycaster(three.camera.position, vector.sub(three.camera.position).normalize());

            if(ray.intersectObject(three.logo).length > 0){
                document.body.style.cursor = 'pointer';
                logoMouseover = true;
            }
            else if(logoMouseover){
                document.body.style.cursor = 'default';
                logoMouseover = false;
            }

            var intersect = ray.intersectObject(three.sphere);

            if(intersect.length > 0){

                   for (var i = 0; i < hotspots.length; i++) {
                        var hotspot = hotspots[i];
                        //Check hotspot bornes
                        if(intersect[ 0 ].face.normal.x >= hotspot.bornes.getAttribute('minX') && intersect[ 0 ].face.normal.x <= hotspot.bornes.getAttribute('maxX')
                         && intersect[ 0 ].face.normal.y >= hotspot.bornes.getAttribute('minY') && intersect[ 0 ].face.normal.y <= hotspot.bornes.getAttribute('maxY')
                         && intersect[ 0 ].face.normal.z >= hotspot.bornes.getAttribute('minZ') && intersect[ 0 ].face.normal.z <= hotspot.bornes.getAttribute('maxZ')){

                            document.body.style.cursor = 'pointer';
                            hotspotMouseover= true;
                           
                        }else if(hotspotMouseover){
                            if(isUserInteracting) 
                                document.body.style.cursor = 'move';
                            else
                                document.body.style.cursor = 'default';

                            hotspotMouseover = false;
                        }
                    }

            }

            //Left button mouse over
            if(ray.intersectObject(player.left_bt).length > 0){
                document.body.style.cursor = 'pointer';
                three.scene.remove(player.left_bt);
                three.scene.add(player.left_bt2);
                leftMouseover = true;
            }
            else if(ray.intersectObject(player.left_bt2).length == 0 && leftMouseover ){

                three.scene.remove(player.left_bt2);
                three.scene.add(player.left_bt);
                document.body.style.cursor = 'default';
                leftMouseover = false;
            }

            //Right button mouse over
            if(ray.intersectObject(player.right_bt).length > 0){
                document.body.style.cursor = 'pointer';
                three.scene.remove(player.right_bt);
                three.scene.add(player.right_bt2);
                rightMouseover = true;
            }
            else if(ray.intersectObject(player.right_bt2).length == 0 && rightMouseover ){

                three.scene.remove(player.right_bt2);
                three.scene.add(player.right_bt);
                document.body.style.cursor = 'default';
                rightMouseover = false;
            }

            //Stop button mouse over
            if(ray.intersectObject(player.stop_bt).length > 0 && !stopMouseover && !isStopInteracting){
                document.body.style.cursor = 'pointer';
                three.scene.remove(player.stop_bt);
                three.scene.add(player.stop_bt2);
                stopMouseover = true;
            }
            else if(ray.intersectObject(player.stop_bt2).length == 0 && stopMouseover && !isStopInteracting ){
                three.scene.remove(player.stop_bt2);
                three.scene.add(player.stop_bt);
                document.body.style.cursor = 'default';
                stopMouseover = false;
            }

            //Start button mouse over
            if(ray.intersectObject(player.start_bt).length > 0 && !startMouseover && !isStartInteracting){
                document.body.style.cursor = 'pointer';
                three.scene.remove(player.start_bt);
                three.scene.add(player.start_bt2);
                startMouseover = true;
            }
            else if(ray.intersectObject(player.start_bt2).length == 0 && startMouseover && !isStartInteracting ){

                three.scene.remove(player.start_bt2);
                three.scene.add(player.start_bt);
                document.body.style.cursor = 'default';
                startMouseover = false;
            }

            //Display button mouse over
            if(ray.intersectObject(player.display_bt).length > 0){
                document.body.style.cursor = 'pointer';
                three.scene.remove(player.display_bt);
                three.scene.add(player.display_bt2);
                displayMouseover = true;
            }
            else if(ray.intersectObject(player.display_bt2).length == 0 && displayMouseover ){

                three.scene.remove(player.display_bt2);
                three.scene.add(player.display_bt);
                document.body.style.cursor = 'default';
                displayMouseover = false;
            }

            //Default rotation
            if(!isUserInteracting && !isStopInteracting){
                //three.sphere.rotation.y += angleChange;
                three.global.rotation.y += angleChange;
            }
            else if(isLeftInteracting){
                //Left rotation
                three.global.rotation.y -= angleChange*3;

            }
            else if(isRightInteracting){
                //Left rotation
                three.global.rotation.y += angleChange*3;

            }
            else if(pressStopButton){
                three.scene.remove(player.stop_bt2);
                three.scene.remove(player.stop_bt);
                three.scene.add(player.start_bt);
                pressStopButton = false;
                isStartInteracting = false;
               
            }
            else if(pressStartButton){
                three.scene.remove(player.start_bt2);
                three.scene.remove(player.start_bt);
                three.scene.add(player.stop_bt);
                pressStartButton = false;
                isStopInteracting = false;
                
            }
            else if (isUserInteracting) {
                //Rotation of sphere in function of the mouse move
				movementX = (eventMouseX - onMouseDownMouseX);
				movementX = -movementX>0 ? -movementX : movementX;

				movementY = (eventMouseY - onMouseDownMouseY);
				movementY = -movementY>0 ? -movementY : movementY;
				
				if (movementX > 10)
				{
					if(eventMouseX < onMouseDownMouseX)
						three.global.rotation.y -= angleChange*Math.exp((onMouseDownMouseX - eventMouseX)*0.005);
					else if(eventMouseX > onMouseDownMouseX)
					   three.global.rotation.y += angleChange*Math.exp((eventMouseX-onMouseDownMouseX)*0.005);
			   }
			   if (movementY > 10)
			   {
					if (eventMouseY < onMouseDownMouseY)
						three.global.rotation.x += angleChange*Math.exp((onMouseDownMouseY - eventMouseY)*0.01);
					else if(eventMouseY > onMouseDownMouseY)
						three.global.rotation.x -= angleChange*Math.exp((eventMouseY-onMouseDownMouseY)*0.01);
				}
           }
           lastTime = time;

            // render
            three.renderer.render(three.scene, three.camera);

            if ( texture ) texture.needsUpdate = true;

            // request new frame
            requestAnimFrame(function(){
                animate(lastTime, angularSpeed, three, player);
            });

    }
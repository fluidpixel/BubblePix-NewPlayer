self.addEventListener('message', function(e) {
	var data = e.data;
	switch (data.cmd) {
		case 'start':
		
			self.postMessage('WORKER STARTED: ' + data.imageData.data.length);
			self.postMessage('Ctx: ' + data.context);

			break;

	};
}, false); 
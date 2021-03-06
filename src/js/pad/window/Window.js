define([
	'ui/dialog/Dialogs',
	'ui/exports/Exports'
], function(Dialogs, Exports) {
	var gui = require('nw.gui');
	var win = gui.Window.get();
	var moment = require('moment');

	var orgTitle = i18n.t('pad:untitled');
	var edited = false,
		delayClose = false;

	var config = store.get('Window') || {};

	if (config.isFullscreen) {
		setTimeout(function() {
			win.enterFullscreen();
		}, 150);
	} else {
		nw.resizeTo(config.width, config.height);
	}

	function close() {
		nw.emit('destory');
		nw.file.trigger('close');

		win.hide();

		if (!win.isFullscreen) {
			config.width = win.width;
			config.height = win.height;
			config.x = win.x;
			config.y = win.y;
		}

		config.zoom = win.zoom;
		config.isFullscreen = win.isFullscreen;
		store.set('Window', config);

		win.setBadgeLabel('');
		win.close(true);
	}

	win.on('close', function() {
		if (edited) {
			delyClose = true;
			Dialogs.save.show();
			return;
		} else {
			close();
		}
	});

	Dialogs.save.bind('save', function() {
		delayClose = true;
		window.ee.emit('menu.file.save');
	});

	Dialogs.save.bind('dont-save', function() {
		// nw.file.trigger('close');
		close();
	});

	var reloadFile;
	Dialogs.reload.bind('reload', function() {
		window.ee.emit('reload');
		// window.parent.ee.emit('file.reload', reloadFile, function(err, data) {
		// 	window.ee.emit('file.reloaded', data);
		// });
	});

	window.ee.on('file.update', function(file) {
		reloadFile = file;
		Dialogs.reload.show(file);
	});

	window.ee.on('file.close', function() {
		win.emit('close');
	});

	window.ee.on('file.opened', function() {
		var opt = nw.file.toJSON();

		if (opt.tmp) {
			// nw.title = 'Restored (writen at ' + moment(opt.ctime).format('LLL') + ')';
			nw.title = i18n.t('pad:restored-file').replace('{{date}}', moment(opt.ctime).format('LLL'));
		} else {
			nw.title = orgTitle = opt.basename || orgTitle;
		}

		if (opt.readOnly) {
			nw.title += ' ('+ i18n.t('pad:read-only-file') +')';
		}
	});
	// window.ee.on('file.opened', function(opt) {
	// 	win.title = orgTitle = opt.basename || orgTitle;

	// 	if (win._params.readOnly) {
	// 		win.title += ' (read only)';
	// 	}
	//  	});

	nw.on('file.saved', function(opt) {
		win.title = orgTitle = opt.basename;

		if (delayClose) {
			close();
		}

		delayClose = false;
		edited = false;
	});

	window.ee.on('change.before.markdown', function(markdown, html, editor) {
		win.title = orgTitle + ' ('+ i18n.t('pad:modified') +')';
		edited = true;
	});

	window.addEventListener('keydown', function(e) {

		var evt = document.createEvent("Events");
		evt.initEvent("keydown", true, true);

		evt.view = e.view;
		evt.altKey = e.altKey;
		evt.ctrlKey = e.ctrlKey;
		evt.shiftKey = e.shiftKey;
		evt.metaKey = e.metaKey;
		evt.keyCode = e.keyCode;
		evt.charCode = e.charCode;

		window.parent.dispatchEvent(evt);

	}, false);

	$('#editor').bind('contextmenu', function(e, ev) {
		var x, y;
		e.preventDefault();
		e = (ev) ? ev : e;

		x = e.screenX;
		y = e.screenY;

		switch (process.platform) {
			case 'linux':
				x = x + win.x;
				y = y + win.y;
			break;
			default:
				break;
		}

		//fixed #135
		if (win.isFullscreen) {

			switch (process.platform) {
				case 'win32':
					y -= 49;
					x -= 7;
					break;
				case 'linux':
					y -= 28;
					break;
				default:
					y -= 40;
					break;
			}
		}

		if (ev) {
			window.parent.ee.emit('popup.context.viewer', x, y);
		} else {
			window.parent.ee.emit('popup.context.editor', x, y);
		}

		return false;
	});


	var resizeTimeout;
	window.onresize = function(e) {

		clearTimeout(resizeTimeout);

		resizeTimeout = setTimeout(function() {
			config.width = win.width;
			config.height = win.height;
			config.x = win.x;
			config.y = win.y;

			store.set('Window', config);
		}, 250);

	}

	win.on('enter-fullscreen', function() {
		document.querySelector('.CodeMirror-gutters').style.height = '3000px';

		global._gaq.push('haroopad.window', 'fullscreen', 'true');
	});

	win.on('leave-fullscreen', function() {

		global._gaq.push('haroopad.window', 'fullscreen', 'false');
		// config.isFullscreen = win.isFullscreen;
		// store.set('Window', config);
	});

	window.ee.on('view.fullscreen', function() {
		var isFull = win.isFullscreen;

		if (isFull) {
			win.leaveFullscreen();
			config.isFullscreen = win.isFullscreen;
			store.set('Window', config);
		} else {
			/* codemirror redraw delay bug */
			// document.querySelector('.CodeMirror-gutters').style.height = '3000px';
			win.enterFullscreen();
		}
	});

	/* update haroopad */
	window.ee.on('update.haroopad', function(currVersion, newVersion, link) {
		Notifier.notify('<a href="http://pad.haroopress.com/page.html?f=release-notes" style="color:yellow">'+ i18n.t('pad:upgrade.note') +'</a>, <a href="http://pad.haroopress.com/user.html#download" style="color:yellow">'+ i18n.t('pad:upgrade.download') +'</a>', i18n.t('pad:upgrade.message') + ' <span style="color:yellow">v' + newVersion +'</span>', undefined, 10000);
		// var noti = NotificationWrapper('Haroopad', i18n.t('pad:upgrade.message') +'\n'+ newVersion);
		
		// noti.addEventListener('click', function() {
		// 	global.Shell.openExternal('http://pad.haroopress.com/user.html#download');
		// });
	});

	/* up to date haroopad */
	window.ee.on('up.to.date.haroopad', function(version) {
		NotificationWrapper('Haroopad', i18n.t('pad:upgrade.uptodate'));
		// Notifier.notify(i18n.t('pad:upgrade.newest'), i18n.t('pad:upgrade.uptodate'), undefined, 5000);
	});

	window.ee.on('print.editor', function() {
		// TODO print after popup window
	});

	keymage('defmod-enter', function() {
		window.ee.emit('view.fullscreen');
	}, { preventDefault: true });

	keymage('defmod-f11', function() {
		window.ee.emit('view.fullscreen');
	}, { preventDefault: true });

	keymage('esc esc', function() {
		if (win.isFullscreen) {
			win.leaveFullscreen();
			config.isFullscreen = win.isFullscreen;
			store.set('Window', config);
		}
	});

	win.on('focus', function() {
		window.parent.ee.emit('focus');
	});
	win.on('blur', function() {
		window.parent.ee.emit('blur');
	});

	window.ondragover = function(e) {
		e.preventDefault();
		return false
	};
	window.ondrop = function(e) {
		e.preventDefault();
		return false
	};
});
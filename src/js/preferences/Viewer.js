define([
		'Viewer.opt'
	], function(options) {

		var config = options.toJSON();

		options.bind('change', function(model) {
			var prop, en,
				data = model.changedAttributes();

			for (prop in data) {
				en = 'preferences.viewer.'+ prop;
				window.parent.win.emit(en, data[prop]);
			}
		});

		var ViewerTabView = Backbone.View.extend({
			el: '#viewer-tab',

			events: {
				'change select[name=viewStyle]': 'changeViewStyle',
				'click input[name=clickableLink]': 'clickableLink'	
			},

			initialize: function() {
				this.$el.find('select[name=viewStyle]').select2().select2("val", config.viewStyle);
				
				this.$el.find('input[name=clickableLink]').prop('checked', config.clickableLink);
			},

			changeViewStyle: function(e) {
				options.set({ viewStyle: e.val });
			},

			clickableLink: function(e) {
				var bool = $(e.target).is(':checked');
				options.set('clickableLink', bool);
			}
		});

		return new ViewerTabView;

});
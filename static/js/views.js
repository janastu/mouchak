(function(M) {
  /* Backbone views for corresponding models in models.js for the Mouchak
   * framework */
  var TextView = Backbone.View.extend({
    tagName: 'div',
    className: '',
    initialize: function() {
      _.bindAll(this);
      _.bind(this.render, this);
    },
    render: function(el) {
      $(el).append(this.el);
      var title = this.model.get('title') || '';
      var str = '<h4>'+ title +'</h4> <p>' +
      this.model.get('data') + '</p>';
      $(this.el).html(str);
      M.appendAttrs(this.model, this.el);
    }
  });

  var TableView = Backbone.View.extend({
    tagName: 'table',
    className: 'table',
    initialize: function() {
      _.bindAll(this);
      _.bind(this.render, this);
    },
    render: function(el) {
      var heading = this.model.get('data').th;
      var str = '<tr>';

      for(var i = 0; i < heading.length; i++) {
        str += '<th>' + heading[i] + '</th>';
      }
      str += '</tr>';

      _.each(this.model.get('data').tr, function(row) {
        str += '<tr>';
        for(var i = 0; i < row.length; i++) {
          if(row[i].match(/http.?:/)) {
            //console.log(row[i].match(/http:/))
          }
          str += '<td>'+ row[i] + '</td>';
        }
        str += '</tr>';
      });

      $(el).append(this.el);
      $(this.el).html(str);
      M.appendAttrs(this.model, this.el);
    }
  });

  var ImageView = Backbone.View.extend({
    tagName: 'img',
    className: '',

    initialize: function() {
      _.bindAll(this);
      _.bind(this.render, this);
    },
    render: function(el) {
      $(el).append(this.el);
      $(this.el).attr('src', this.model.get('src'));
      M.appendAttrs(this.model, this.el);
    }
  });

  var VideoView = Backbone.View.extend({
    initialize: function() {
      _.bindAll(this);
      _.bind(this.render, this);
      // assuming cross-domain urls will have http in the src,
      // so also assuming they are embedded flash urls,
      // hence iframe
      if(this.model.get('src').match('http')) {
        this.tagName = 'iframe';
      }
      // otherwise, use html5 video tag, if the video is served
      // from the same domain
      else {
        this.tagName = 'video';
      }
    },
    render: function(el) {
     $(el).append(this.el);
     $(this.el).attr('src', this.model.get('src'));
     M.appendAttrs(this.model, this.el);
    }
  });

  var RSSView = Backbone.View.extend({
    el: '#feeds',
    initialize: function() {
      _.bindAll(this);
      _.bind(this.render, this);
    },
    render: function() {
      //M.populateFeeds(this.model.get('src'));
      //TODO: move that function here..
    }
  });

  var PluginView = Backbone.View.extend({
    initialize: function() {
      return;
    },
    render: function(el) {
      return;
    }
  });

  var PageView = Backbone.View.extend({
    tagName: 'div',
    className: 'pageview',
    initialize: function() {
      _.bindAll(this);
      _.bind(this.render, this);
      this.render();
      $(this.el).hide();
    },
    render: function() {
      $('#content-container').append(this.el);
      this.appendNavTemplate();
      $(this.el).append('<h3>'+this.model.get('title')+'</h3>');
      var self = this;
      _.each(this.model.get('content'), function(item) {
        var view = M.types.view[item.get('type')];
        if(!view) {
          console.log('Error initing view', item);
          return;
        }
        if(item.get('type') === 'rss') {
          M.rss_view = new view({model: item});
          $(self.el).append(_.template($('#news-template').html()));
        }
        else {
          var item_view = new view({model: item});
          item_view.render(self.el);
        }
      });
    },
    appendNavTemplate: function() {
      var li;
      var nav_template = _.template($('#nav-template').html());
      $(this.el).append(nav_template({
        page: this.model.id
      }));
    }
  });

  //export types to the typemap
  M.types = M.types || {};
  M.types.view = {
    'text': TextView,
    'image': ImageView,
    'video': VideoView,
    'rss': RSSView,
    'table': TableView,
    'plugin': PluginView,
    'PageView': PageView
  };
})(M);

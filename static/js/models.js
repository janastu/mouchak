(function(M) {
  /*Backbone models and collections for Mouchak */
  var BaseType = Backbone.Model.extend({
    defaults: {
      tags: [],
      title: "",
      attr: {}
    },
    initialize: function() {
    }
  });

  var Text = BaseType.extend({
    defaults: {
      data: "",
    },
    initialize: function() {
    }
  });

  var Table = BaseType.extend({
    defaults: {
      data : {
        th: [],
        tr:[]
      }
    },
    initialize: function() {
    }
  });

  var Image = BaseType.extend({
    defaults: {
      src: ""
    },
    initialize:function() {
    }
  });

  var Video = BaseType.extend({
    defaults: {
      src: ""
    },
    initialize:function() {
    }
  });

  var RSS = BaseType.extend({
    defaults: {
      src: ""
    },
    initialize:function() {
    }
  });

  // Plugin model can be used to load dynamic components
  // to the website by loading external JS files.
  // Also the website can be styled by using external CSS files,
  // which can also be loaded via this plugin model.
  var Plugin = BaseType.extend({
    defaults: {
      src: "",
      data: {},
      callback: ""
    },
    initialize: function() {
      if(this.get('src').match(/\.js/)) {
        var script = document.createElement('script');
        var callback = this.get('callback');
        script.src = this.get('src');
        document.body.appendChild(script);
        script.onload = function() {
          eval(callback);
        };
      }
      else if(this.get('src').match(/\.css/)) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = this.get('src');
        link.type = 'text/css';
        document.body.appendChild(link);
      }
    }
  });

  // model for each Page
  var Page = Backbone.Model.extend({
    defaults: {
      name: "index",
      title: "",
      children: [],
      content: []
    },
    initialize: function() {
      // adding the name of the model as its id.
      // look up of this model through the collection
      // is faster this way.
      //this.set({id: M.sanitize(this.get('name'))});
      this.set({id: this.get('id')});
    }
  });

  var Pages = Backbone.Collection.extend({
    model: Page
  });

  //export types to the typemap
  M.types = M.types || {};
  M.types.model = {
    'text': Text,
    'image': Image,
    'video': Video,
    'rss': RSS,
    'table': Table,
    'plugin': Plugin,
    'Page': Page,
    'Pages': Pages
  };

})(M);

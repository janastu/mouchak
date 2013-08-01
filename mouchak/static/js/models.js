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
    defaults: _.extend(BaseType.prototype.defaults, {
      data: "",
    }),
    initialize: function() {
      BaseType.prototype.initialize.call(this, arguments);
    }
  });

  var Table = BaseType.extend({
    defaults: _.extend(BaseType.prototype.defaults, {
      data : {
        th: [],
        tr:[]
      }
    }),
    initialize: function() {
      BaseType.prototype.initialize.call(this, arguments);
    }
  });

  var Image = BaseType.extend({
    defaults: _.extend(BaseType.prototype.defaults, {
      src: ""
    }),
    initialize:function() {
      BaseType.prototype.initialize.call(this, arguments);
    }
  });

  var Video = BaseType.extend({
    defaults: _.extend(BaseType.prototype.defaults, {
      src: ""
    }),
    initialize:function() {
      BaseType.prototype.initialize.call(this, arguments);
    }
  });

  var RSS = BaseType.extend({
    defaults: _.extend(BaseType.prototype.defaults, {
      src: ""
    }),
    initialize:function() {
      BaseType.prototype.initialize.call(this, arguments);
    }
  });

  // Plugin model can be used to load dynamic components
  // to the website by loading external JS files.
  // Also the website can be styled by using external CSS files,
  // which can also be loaded via this plugin model.
  var Plugin = BaseType.extend({
    defaults: _.extend(BaseType.prototype.defaults, {
      src: "",
      data: {},
      callback: ""
    }),
    initialize: function() {
      BaseType.prototype.initialize.call(this, arguments);

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
      name: "",
      title: "",
      children: [],
      content: [],
      showNav: true
    },
    initialize: function() {
      this.id = this.get('id');
      this.set({id: this.get('id')});
    }
  });

  var Pages = Backbone.Collection.extend({
    model: Page
  });

  var Menu = Backbone.Model.extend({
    defaults: {
      customMenu: false
    },
    url: function() {
      return '/menu/' + this.id;
    },
    initialize: function() {
      this.id = this.get('id');
    },
  });

  //export types to the typemap
  M.types = M.types || {};
  M.types.model = {
    'text': Text,
    'image': Image,
    'video': Video,
    'menu': Menu,
    'rss': RSS,
    'table': Table,
    'plugin': Plugin,
    'Page': Page,
    'Pages': Pages
  };

})(M);

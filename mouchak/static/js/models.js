(function(M) {
  /*Backbone models and collections for Mouchak */
  var BaseType = Backbone.Model.extend({
    defaults: {
      tags: [],
      title: "",
      attr: {},
      type: ''
    },
    initialize: function() {
    }
  });

  var Text = BaseType.extend({
    defaults: _.extend({
      data: ""
    }, BaseType.prototype.defaults),
    initialize: function() {
      BaseType.prototype.initialize.call(this, arguments);
    }
  });

  var Table = BaseType.extend({
    defaults: _.extend({
      data : {
        th: [],
        tr:[]
      }
    }, BaseType.prototype.defaults),
    initialize: function() {
      BaseType.prototype.initialize.call(this, arguments);
    }
  });

  var Image = BaseType.extend({
    defaults: _.extend({
      src: ""
    }, BaseType.prototype.defaults),
    initialize:function() {
      BaseType.prototype.initialize.call(this, arguments);
    }
  });

  var Video = BaseType.extend({
    defaults: _.extend({
      src: ""
    }, BaseType.prototype.defaults),
    initialize:function() {
      BaseType.prototype.initialize.call(this, arguments);
    }
  });

  var RSS = BaseType.extend({
    defaults: _.extend({
      src: ""
    }, BaseType.prototype.defaults),
    initialize:function() {
      BaseType.prototype.initialize.call(this, arguments);
    }
  });

  // Map model
  var Map = BaseType.extend({
    defaults: _.extend({
      tileLayer: "",
      shp: ""
    }, BaseType.prototype.defaults),
    initialize: function(){
      BaseType.prototype.initialize.call(this, arguments);
    }
  });

  //Create a model, which will accept an url for data-src,
  //the data-src is used to create models further and assign view to it.
  var FeedType = BaseType.extend({
    defaults: _.extend({
      dataSrc: "",
      containerElement: "",
      templateElement: ""
    }, BaseType.prototype.defaults),
    initialize: function() {
      BaseType.prototype.initialize.call(this, arguments);
    }
  });
  // Plugin model can be used to load dynamic components
  // to the website by loading external JS files.
  // Also the website can be styled by using external CSS files,
  // which can also be loaded via this plugin model.
  var Plugin = BaseType.extend({
    defaults: _.extend({
      src: "",
      data: {},
      callback: ""
    }, BaseType.prototype.defaults),

    initialize: function() {
      BaseType.prototype.initialize.call(this, arguments);
      if(this.get('src').match(/\.js/)) {
        this.set({'plugin_type': 'js'});
      }
      else if(this.get('src').match(/\.css/)) {
        this.set({'plugin_type': 'css'});
      }
    },
    exec: function() {
      console.log('exec called');
      if(this.get('src').match(/\.js/)) {
        var script = document.createElement('script');
        var callback = this.get('callback');
        script.src = this.get('src');
        document.body.appendChild(script);
        if(callback) {
          script.onload = function() {
            eval(callback);
          };
        }
      }
      else if(this.get('src').match(/\.css/)) {
        console.log('css plugin found.. <'+ this.get('src')+'> loading it..');
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = this.get('src');
        link.type = 'text/css';
        document.body.appendChild(link);
      }
    },
    // get the source code of the plugin from the src path
    getCode: function(cb) {
      var self = this;
      //NOTE: jQuery executes the code(css or js) as soon as it is returned by
      //the server. Apparently, there is no way to tell jQuery not to execute
      //the piece of code retrieved.
      //Hecnce, right now its a HACK to workaround this problem.
      // We use dataFilter which is called by jQuery to process the raw xhr
      // response sent, and jQuery expects back a filtered/sanitized data so
      // that it can call the success callback with that data. We use
      // dataFilter to do our processing there, and return an empty string;
      // this apparently prevents jQuery from executing the code.
      // TODO: find a better way to workaround this.
      // TODO: find out how cloud-based IDEs load up code files for editing.
      $.ajax({
        type: 'GET',
        url: self.get('src'),
        dataFilter: function(data, type) {
          cb(data);
          return '';
        },
        cache: false,
        success: function(data) {
          //cb(data);
        }
      });
    },
    // save the source code of the plugin to the src path
    saveCode: function(data, cb) {
      var self = this;
      $.ajax({
        type: 'POST',
        url: this.get('src'),
        data: {code: data},
        success: function(data) {
          cb(data);
        }
      });
    }
  });

  // model for each Page
  var Page = Backbone.Model.extend({
    defaults: {
      name: "",
      title: "",
      children: [],
      content: [],
      categories: [],
      tags: [],
      published: false,
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
      return M.MenuURL() + '/' + this.id;
    },
    initialize: function() {
      this.id = this.get('id');
    }
  });

  var Footer = Backbone.Model.extend({
    defaults: {
      html: ''
    },
    url: function() {
      return M.FooterURL() + '/' + this.id;
    },
    initialize: function() {
      this.id = this.get('id');
    }
  });

  var Header = Backbone.Model.extend({
    defaults: {
      html: ''
    },
    url: function() {
      return M.HeaderURL() + '/' + this.id;
    },
    initialize: function() {
      this.id = this.get('id');
    }
  });

  //export types to the typemap
  M.types = M.types || {};
  M.types.model = {
    'base': BaseType,
    'text': Text,
    'image': Image,
    'video': Video,
    'menu': Menu,
    'footer': Footer,
    'header': Header,
    'rss': RSS,
    'table': Table,
    'plugin': Plugin,
    'map': Map,
    'Page': Page,
    'Pages': Pages,
    'FeedView': FeedType
  };

  //content types to render in content menu
  M.contentTypes = ['text', 'image', 'video', 'table', 'plugin', 'map', 'FeedView'];

})(M);

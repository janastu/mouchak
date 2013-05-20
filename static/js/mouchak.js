(function(M) {
/*
 * */

var types;
M.types = types = {};

var AppView = Backbone.View.extend({
  el: 'body',
  events: {
  },
  initialize: function() {
    _.bindAll(this);
  },
  render: function() {
    var navview = new NavigationView();
    navview.render();
  },
  updateBreadcrumbs: function(event) {
    //TODO: write code to use bootstrap's breadcrumbs to render a
    // navigational breadcrumb
  }
});

var NavigationView = Backbone.View.extend({
  el: '#navigation',
  events: {
    'click .nav li a' : 'navClicked'
  },
  initialize: function() {
    _.bindAll(this);
    this.template = _.template($('#nav-bar-template').html());
  },
  render: function() {
    this.$el.append(this.template({}));
    this.$ul = $('.nav');
    this.populate();
  },
  populate: function() {
    var item_template = _.template($('#nav-item-template').html());
    _.each(M.pages.models, function(page) {
      console.log(_.isEmpty(page.get('children')));
      this.$ul.append(item_template({
        cls: (_.isEmpty(page.get('children'))) ? '' : 'dropdown',
        page: page.get('name')
      }));
    }, this);
    this.$links = $('.nav li');
    //console.log(this.$links[0]);
    $(this.$links[0]).addClass('active');
  },
  navClicked: function(event) {
    console.log('navClicked');
    this.$links.removeClass('active');
    $(event.currentTarget).parent().addClass('active');
  }
});

var AppRouter = Backbone.Router.extend({
  routes : {
    //'index' : 'index',
    ':page' : 'showPage'
  },
  /*index: function() {
    $('.pageview').hide();
    var id = nameIdMap['index'];
    $('#'+id).show();
  },*/
  showPage: function(page) {
    $('.pageview').hide();
    //news pages are rendered on the fly,
    //as feeds have to be fetched.
    if(page === 'news') {
      M.rss_view.render();
    }
    var id = nameIdMap[page];
    $('#'+id).show();
    $('.'+page).show();
  }
});

// hashmap to maintain one-to-one lookup among page ids and 
// their names
var nameIdMap = {};

// initialize the app
M.init = function() {
	M.tags = {}; //global tag cache

  // global collection of pages
  M.pages = new types.model.Pages(M.site_content);

  // iterate through pages to get their content and render them using views and
  // models
  _.each(M.pages.models, function(page) {
    var contents = [];
    _.each(page.get('content'), function(content, idx) {
      // empty content!
      if(_.isEmpty(content)) {
        console.log('NOTICE: Empty content for ' + page.get('name') + ' at ' +
          idx);
        return;
      }

      var ContentModel = types.model[content.type];
      if(!ContentModel) {
        throw new Error('Invalid type. Not a Mouchak type: ' + content.type);
        return;
      }
      var contentmodel = new ContentModel(content);
      contents.push(contentmodel);
      //index the tags in the content
      M.createTagList(content, contentmodel);
    });

    page.set({content: contents});
    var pageview = new types.view.PageView({model: page, id: page.id});

    // prepare the name to id map
    nameIdMap[page.get('name')] = page.id;
  });

  M.appView = new AppView();
  M.appView.render();

  var app_router = new AppRouter();
  Backbone.history.start();

  var startpage = M.pages.models[0].get('name');
  app_router.navigate(startpage, {trigger: true});

  //M.simHeir();
};

// hack to simulate heirarchy among the page views
// basically add the parent id as class in all of its children
// elements.
M.simHeir = function() {
  _.each(M.pages.models, function(page) {
    if(page.id == 'index') return;
    _.each(page.get('children'), function(child) {
      child = M.sanitize(child);
      $('#'+child).addClass(page.id);
    });
  });
};


// append attributes to elements from the model
M.appendAttrs = function(model, el) {
  _.each(model.get('attr'), function(val, key) {
    $(el).attr(key, val);
  });
}

// create the list of tags and associate the objects with related tags
M.createTagList = function(content, model) {
  for(var i in content.tags) {
    if(!M.tags[content.tags[i]]) {
      M.tags[content.tags[i]] = [];
    }
    M.tags[content.tags[i]].push(model);
  }
};

// Filter the tags and return only those "content" objects which match a given tag.
// @tags should be an array
M.filterTags = function(tags) {
	if(!_.isArray(tags)) {
    //console.log('You have to pass an array'); //TODO: raise an exception
    throw new Error(' accepts only an array of strings');
    return false;
  }
  var list = [];
  _.each(tags, function(item) {
    if(M.tags[item]) {
      list.push(M.tags[item]);
    }
  });
  return _.uniq(_.flatten(list));
};

// populate with news feeds in the news section
// gets the feeds from server side script 'feed.py'
M.populateFeeds = function(rss_url) {
  $('#feeds-loader').show();
  $('.news-item-wrapper').remove();
  jQuery.getFeed({
    url: 'feeds',
    type: 'GET',
    data: "rss_url="+encodeURIComponent(rss_url),
    success: function(feed) {
      $('#feeds-loader').hide();
      var template = _.template($('#news-item-template').html());
      _.each(feed.items, function(item) {
        x = $('#feeds').append(template({
          title: item.title,
          link: item.link
        }));
      });
    },
    error: function(err) {
      $('#feeds-loader').hide();
      $('#feeds').append('Oops, something went wrong! <br/> Please try again.');
    }
  });
};


/* Other helper functions */

// change all '-' to spaces and capitalize first letter of
// every word
M.humanReadable = function(str) {
  if(typeof str !== "string") {
    str = '';
  }
  return '' + str.replace(/[-]+/g, ' ').replace(/[^\s]+/g, function(str) {
    return str.substr(0,1).toUpperCase() + str.substr(1).toLowerCase();
  });
};

// change all spaces to '-' and everything to lowercase
M.sanitize = function(str) {
  if(typeof str !== "string") {
    str = '';
  }
  return '' + str.replace(/[\s]+/g,'-').replace(/[^\s]+/g, function(str) {
    //TODO: handle special characters!
    return str.replace('&', 'and').toLowerCase();
  });
};

})(M);

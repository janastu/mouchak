(function(M) {

var types;
M.types = types = {};

var AppView = Backbone.View.extend({
  el: 'body',
  events: {
    'click .nav li a' : 'navClicked'
  },
  initialize: function() {
    _.bindAll(this);
  },
  render: function() {
    $('#index').show();
    _.each(M.pages.models, function(page) {
      this.createNavigation(page.id);
    }, this);
  },
  navClicked: function(event) {
    $('.nav li').removeClass('active');
    $(event.currentTarget).parent().addClass('active');
  },
  createNavigation: function(pageid) {
    var li, page = M.pages.get(pageid);
    console.log(page.id, page.get('name'));
    if(page.get('name') === 'index' && !_.isEmpty(page.get('children'))) {
      var id = nameIdMap['index'];
      li = '<li class="active"><a href="#/index"> Home </a></li>';
      $('#nav-'+ id +' .nav').append(li);
    }
    var dropdown_template = _.template($('#nav-dropdown-template').html());
    var children = page.get('children');
    _.each(children, function(child) {
      console.log('children of ', page.get('name'), child);
      var id = nameIdMap[child];
      var model = M.pages.get(id);
      if(!_.isObject(model)) {
        console.log('Error: Cannot find page '+ child +' which is defined as children of ' + page.get('name'));
        return false;
      }
      var children = model.get('children');
      if(_.isEmpty(children)) {
        li = '<li><a href="#/' + child + '">' + M.humanReadable(child) + '</a></li>';
        console.log('li: ', li);
      }
      else {
        li = dropdown_template({
          name: M.humanReadable(model.get('name')),
          list: _.map(children, M.humanReadable)
        });
      }
      console.log('nav el: ', $('#nav-' + page.id + ' .nav'));
      //$(li).appendTo('#nav-' + page + ' .nav');
      $('#nav-'+ page.id +' .nav').append(li);
    });
  },
  updateBreadcrumbs: function(event) {
    //TODO: write code to use bootstrap's breadcrumbs to render a
    // navigational breadcrumb
  }
});

var AppRouter = Backbone.Router.extend({
  routes : {
    'index' : 'index',
    ':page' : 'showPage'
  },
  index: function() {
    $('.pageview').hide();
    var id = nameIdMap['index'];
    $('#'+id).show();
  },
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

/* Defining other necessary functions */
M.init = function() {
	M.tags = {}; //global tag cache
  M.pages = new M.types.model.Pages(); //global collection of all pages

  // iterate through the JSON to intialize models and views
	_.each(M.site_content, function(page) {
    var new_page = new M.types.model.Page(page);
    var contents = [];
		_.each(page.content, function(content) {
      if(_.isEmpty(content)) {
        console.log('Empty content for ' + page.name);
        return;
      }
      var Item = types.model[content.type];
      if(!Item) {
        console.log('Error: Invalid type '+ content.type +' for ', content);
        return;
      }
      var item = new Item(content);
      contents.push(item);
      M.createTagList(content, item);
		});
    new_page.set({content: contents});
    var new_page_view = new M.types.view.PageView({model: new_page,
      id: new_page.get('id')});
    M.pages.add(new_page);
    nameIdMap[new_page.get('name')] = new_page.id; 
	});

  M.appView = new AppView();
  M.appView.render();
  var app_router = new AppRouter();
  Backbone.history.start();
  app_router.navigate('index', {trigger: true});
  // start with index page
  //var location = window.location;
  /*location.href = location.protocol + '//' + location.hostname +
    location.pathname + '#/index';*/
  M.simHeir();
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
    console.log('You have to pass an array'); //TODO: raise an exception
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

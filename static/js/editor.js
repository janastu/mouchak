(function (M) {
  var PageListView = Backbone.View.extend({
    tagName: 'div',
    className: '',
    id: 'pages',
    events: {
      'click .pagename .disp': 'showPage',
      'click #addPage': 'addPage',
      'click .pagename .remove': 'removePage'
    },
    initialize: function() {
      _.bindAll(this);
      _.bind(this.render, this);
      this.template = _.template($('#page-list-template').html());
      this.listTemplate = _.template($('#page-list-item-template').html());
      // append this.el to container #pages
      $('#content-container').append(this.$el);
      this.$el.append(this.template());
      this.$pagelist = $('#pagelist');
    },
    render: function() {
      // append the page list
      this.$pagelist.html('');
      _.each(M.pages.models, function(page) {
        this.$pagelist.append(this.listTemplate({
          name: page.get('name') || 'newpage',
          id: page.id
        }));
      }, this);
    },
    showPage: function(event) {
      var id = $(event.target).attr('id');
      pageview = new PageView({model: M.pages.get(id)});
      pageview.render();
      M.editor.pageview = pageview;
    },
    addPage: function() {
      var newpage = new Page();
      M.pages.add(newpage);
      var newpageview = new PageView({model: newpage});
      newpageview.render();
      M.editor.pageview = newpageview;
    },
    removePage: function(event) {
      var id = $(event.target).parent('.remove').attr('for');
      console.log('remove', id);
      M.pages.get(id).destroy({
        success: function(model, response) {
          console.log('deleted', model, response);
          M.pages.remove(id);
          M.pagelistview.render();
          if(M.editor.pageview) {
            M.editor.pageview.remove();
          }
        },
        error: function(model, xhr) {
          console.log('failed', model, xhr);
        }
      });
    }
  });

  var Page = Backbone.Model.extend({
    defaults: {
      name: '',
      title: '',
      children: [],
      content: []
    },
    initialize: function() {
      this.id = this.get('id');
    }
  });

  var Pages = Backbone.Collection.extend({
    model: Page,
    url: '/edit'
  });

  var PageView = Backbone.View.extend({
    tagName: 'div',
    id: 'page',
    events: {
      'click #updatePage': 'updatePage',
      'click .addContent' : 'addContent',
      'click .content-item': 'showContent',
      'click .content .remove': 'removeContent'
    },
    initialize: function() {
      _.bindAll(this);
      _.bind(this.render, this);
      $('#page').remove();
      $('#content-container').append(this.$el);
      this.template = _.template($('#page-template').html());
      this.contentListTemplate =
        _.template($('#content-list-template').html());
      //this.model.bind('change', this.modelChanged);
      //this.model.bind('change:content', this.contentChanged);
      this.model.bind('change:name', this.nameChanged);
    },
    modelChanged: function(page) {
      console.log('model changed ', page.id, ' re-rendering...');
      this.render();
    },
    contentChanged: function(page) {
      console.log('content changed', page);
      this.render();
    },
    nameChanged: function(page) {
      M.pagelistview.render();
      console.log('name changed', page);
    },
    render: function() {
      console.log(this.$el);
      $('#page').html('');
      console.log('content: ', this.model.get('content'));

      this.$el.html(this.template({
        name: this.model.get('name'),
        title: this.model.get('title'),
        children: this.model.get('children'),
        content: this.listContent()
      }));

      //hover effect
      $('.content-item').hover(function(event) {
        $(event.target).closest('.content-item').addClass('alert-error')
      }, function(event) {
        $(event.target).closest('.content-item').removeClass('alert-error')
      });
      console.log('done');
    },
    listContent: function() {
      var content = '';
      _.each(this.model.get('content'), function(element, idx) {
        content += this.contentListTemplate({
          no: idx,
          type: element.type,
          more: element.src ||
            escapeHtml(element.data.substring(0, 30) + '..'),
          title: (element.title) ? element.title + ',' : ''
        });
      }, this);
      return content;
    },
    showContent: function(event) {
      var idx = $(event.target).closest('.content-item').attr('id').
        split('-')[1];
      this.edit = {on: true, idx: idx};
      var content = this.model.get('content')[idx];
      content = new M.types.model[content.type](content);
      var contentview = new ContentView({model: content});
      contentview.render();
      M.editor.contentview = contentview;
      return false;
    },
    addContent: function() {
      console.log('addContent');
      var content = new M.types.model.text({
        type: 'text',
        title: '',
        data: ''
      });
      this.model.get('content').push(content.toJSON());
      var idx = this.model.get('content').length;
      this.edit = {on: true, idx: idx};
      var contentview = new ContentView({model: content});
      contentview.render();
      M.editor.contentview = contentview;
      return false;
    },
    updateContent: function(json) {
      if(!this.edit.on && this.edit.idx < 0) {
        return;
      }
      var content = this.model.get('content');
      content[this.edit.idx] = json;
      this.edit = {on: false, idx: -1};
      this.model.set({'content': content});
      this.render();
    },
    removeContent: function(event) {
      console.log('recvd remove event..about to process..');
      var content = this.model.get('content');
      var idx = $(event.target).parent().attr('for');
      idx = Number(idx);
      console.log('remove content: ', content[idx]);
      content.splice(idx, 1);
      this.model.set({'content': content});
      console.log('after removing: ', this.model.get('content'));
      this.render();
      return false;
    },
    updatePage: function() {
      var name = $('#name').val();
      var title = $('#title').val();
      var children = $('#children').val();
      children = (children === '') ? [] : children.split(',');
      this.model.set({'name': name, 'title': title, 'children': children});

      this.model.save({}, {
        success: function(model, response) {
          console.log('saved', model, response);
        },
        error: function(model, xhr) {
          console.log('failed', model, xhr);
        }
      });
      return false;
    }
  });

  var ContentView = Backbone.View.extend({
    id: 'contentview',
    events: {
      'click #done': 'done',
      'click #updateContent': 'update',
      'change .contentview select': 'typeChanged'
    },
    initialize: function() {
      _.bindAll(this);
      _.bind(this.render, this);

      $('#pages').hide();
      $('#page').hide();
      $('#content-container').append(this.$el);
      this.template = _.template($('#content-template').html());
    },
    render: function() {
      this.$el.html('');
      console.log(this.model);
      var type = this.model.get('type');
      this.$el.append(this.template({
        type: this.model.get('type'),
        title: this.model.get('title'),
        tags: this.model.get('tags')
      }));

      this.$select = $('.contentview select');
      //this.$select.bind('change', this.typeChanged);
      this.$select.val(type);

      if(type === 'text') {
        var template = _.template($('#text-template').html());
        $('#specific-content').html(template({
          data: this.model.get('data')
        }));
        // init the tinymce editor
        tinymce.init({
          selector: '#edit',
          theme: 'modern',
          height: 300,
          plugins: ["advlist autolink link image lists charmap print preview hr",
                    "anchor pagebreak spellchecker searchreplace wordcount",
                    "visualblocks visualchars code fullscreen insertdatetime",
                    "media nonbreaking save table contextmenu directionality",
                    "emoticons template paste textcolor"
          ],
          toolbar: "undo redo | styleselect | bold italic | " +
                   "alignleft aligncenter alignright alignjustify | " +
                   "bullist numlist outdent indent | link image | " +
                   "print preview media fullpage | forecolor backcolor emoticons"

        });
      } 
      else if(type === 'image' || type === 'video' || type === 'audio') {
        var template = _.template($('#media-template').html());
        $('#specific-content').html(template({
          src: this.model.get('src')
        }));
        
        //provide the users a preview
        /*var view = new M.types.view[type]({model: this.model});
        //$('#specific-content.preview').html();
        view.render('.preview');*/
      }
    },
    typeChanged: function(event) {
      var type = this.$select.val();
      //TODO: do validation on type - a list of valid models is in
      //M.types.model
      this.model.set({'type': type});
      this.render();
    },
    update: function() {
      var prop, val, new_attrs = {};
      $('#contentview [m-data-target]').each(function(idx, elem) {
        prop = $(elem).attr('m-data-target');
        if(prop === 'tags') {
          val = $(elem).val().split(',');
        }
        else {
          val = $(elem).val();
        }
        new_attrs[prop] = val;
      });
      new_attrs['type'] = this.$select.val();
      if($('#edit').length) {
        tinymce.triggerSave(false, true);
        new_attrs['data'] = $('#edit').val();
      }
      this.model.set(new_attrs);
      M.editor.pageview.updateContent(this.model.toJSON());
    },
    cleanUp: function() {
      //this.$el.remove();
      this.remove();
      $('#pages').show();
      $('#page').show();
    },
    done: function() {
      this.update();
      this.cleanUp();
    }
  });

  M.editor = {
    init: function() {
      M.pages = new Pages();
      _.each(M.site_content, function(page) {
        M.pages.add(new Page(page));
      });
      var pagelistview = new PageListView();
      pagelistview.render();
      M.pages.on('add', function(page) {
        pagelistview.render();
      });
      M.pagelistview = pagelistview;
    }
  };

  function escapeHtml(string) {
    var entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': '&quot;',
      "'": '&#39;',
      "/": '&#x2F;'
    };
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return entityMap[s];
        });
  }

})(M);

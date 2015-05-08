(function (M) {

  /* view to manage list of pages - add, remove and show them */
  var PageListView = Backbone.View.extend({
    tagName: 'div',
    className: 'prettybox-side',
    id: 'pages',
    events: {
      'click .pagename .disp': 'showPage',
      'click #addPage': 'addPage',
      'click .pagename .remove': 'removePage',
      'click #menu-config': 'showMenu',
      'click #footer-config': 'showFooterConfig',
      'click #header-config': 'showHeaderConfig',
      'click #uploads': 'uploads'
    },
    initialize: function() {
      _.bindAll.apply(_, [this].concat(_.functions(this)));
      _.bind(this.render, this);
      this.template = _.template($('#page-list-template').html());
      this.listTemplate = _.template($('#page-list-item-template').html());
      // append this.el to container #pages
      $('#content-container').append(this.$el);
      this.$el.append(this.template());
      this.$pagelist = $('#pagelist');
      var menu = M.site_content.menu;
      //console.log(menu);
      this.menuconfig = new M.types.model.menu(menu);
      this.menuconfigview = new MenuConfigView({model: this.menuconfig});
      this.footerconfig = new M.types.model.footer(M.site_content.footer);
      this.footerconfigview = new FooterConfigView({model: this.footerconfig});
      this.headerconfig = new M.types.model.header(M.site_content.header);
      this.headerconfigview = new HeaderConfigView({model: this.headerconfig});
      this.uploadview = new UploadView();
    },
    render: function() {
      // append the page list
      this.$pagelist.html('');
      _.each(M.pages.models, function(page) {
        this.$pagelist.append(this.listTemplate({
          name: page.get('name'),
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
      var newpage = new M.types.model.Page({name: 'newpage'});
      M.pages.add(newpage);
      var self = this;
      M.editor.showOverlay();
      newpage.save({}, {success: function(model, response) {
        M.editor.hideOverlay();
        self.render();
        var newpageview = new PageView({model: newpage});
        newpageview.render();
        M.editor.pageview = newpageview;
      }});
    },
    removePage: function(event) {
      var option = confirm("Are you sure, you want to delete this page?");
      if(!option) {
        return false;
      }
      var id = $(event.target).parent('.remove').attr('for');
      //console.log('remove', id);
      M.pages.get(id).destroy({
        success: function(model, response) {
          M.editor.hideOverlay();
          //console.log('deleted', model, response);
          M.pages.remove(id);
          M.pagelistview.render();
          if(M.editor.pageview) {
            M.editor.pageview.remove();
          }
          M.editor.notifs.show('success', 'Deleted', '');
        },
        error: function(model, xhr) {
          M.editor.hideOverlay();
          console.log('failed', model, xhr);
          var msg = 'Failed to delete. Please try again.';
          M.editor.notifs.show('fail', 'Error!', msg);
        }
      });
      M.editor.showOverlay();
    },
    showMenu: function(event) {
      event.preventDefault();
      this.menuconfigview.render();
      return false;
    },
    showFooterConfig: function(event) {
      event.preventDefault();
      this.footerconfigview.render();
      return false;
    },
    showHeaderConfig: function(event) {
      event.preventDefault();
      this.headerconfigview.render();
      return false;
    },
    uploads: function(event) {
      event.preventDefault();
      this.uploadview.render();
      return false;
    },
    // validate the page list with menu order list
    validate: function()  {
      //TODO: validate if the menu order list matches with the list of pages
      //and provide relevant notifications
    }
  });

  var Pages = Backbone.Collection.extend({
    model: M.types.model.Page,
    url: M.PageURL()
  });

  /* view to manage each page and their properties - change page properties,
   * add content, remove and show content, and update the page */
  var PageView = Backbone.View.extend({
    tagName: 'div',
    className: 'prettybox-lg',
    id: 'page',
    events: {
      'click #updatePage': 'updatePage',
      'click #copyPage': 'duplicatePage',
      'click .addContent' : 'addContent',
      'click .content-item': 'showContent',
      'click .content .remove': 'removeContent'
    },
    initialize: function() {
      _.bindAll.apply(_, [this].concat(_.functions(this)));
      _.bind(this.render, this);
      this.editing = false;
      this.edit_idx = -1;
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
      //console.log('model changed ', page.id, ' re-rendering...');
      this.render();
    },
    contentChanged: function(page) {
      //console.log('content changed', page);
      this.render();
    },
    nameChanged: function(page) {
      //M.pagelistview.render();
      //console.log('name changed', page);
    },
    render: function() {
      $('#page').html('');
      //console.log('content: ', this.model.get('content'));

      this.$el.html(this.template({
        name: this.model.get('name'),
        title: this.model.get('title'),
        children: this.model.get('children'),
        content: this.listContent(),
        categories: this.model.get('categories'),
        tags: this.model.get('tags'),
        checked: this.model.get('showNav') ? 'checked="checked"' : ''
      }));

      //hover effect
      $('.content-item-wrapper').hover(function(event) {
        $(event.currentTarget).addClass('alert-info');
      }, function(event) {
        $(event.currentTarget).removeClass('alert-info');
      });
      // init tooltip on this page view..
      $('#page').tooltip();
    },
    listContent: function() {
      var content = '';
      var base_props = _.keys(new M.types.model.base().defaults);
      _.each(this.model.get('content'), function(element, idx) {
        //prepare the more field
        var moar = '';
        _.each(element, function(v, k) {
          //check if not one of the base properties..add it to more..
          if(_.indexOf(base_props, k) < 0) {
            moar += (v) ? v + ', ' : '';
          }
        });
        content += this.contentListTemplate({
          no: idx,
          type: element.type,
          more: escapeHtml(moar.substring(0, 30) + '..'),
          title: (element.title) ? element.title + ',' : ''
        });
      }, this);
      return content;
    },
    showContent: function(event) {
      var idx = $(event.target).closest('.content-item').attr('id').
        split('-')[1];
      var content = this.model.get('content')[idx];
      content = new M.types.model[content.type](content);
      //console.log('model inited ', content);
      this.editing = true;
      this.edit_idx = idx;
      var contentview = new ContentView({model: content});
      contentview.render();
      M.editor.contentview = contentview;
      return false;
    },
    addContent: function() {
      //console.log('addContent');
      var content = new M.types.model.text({
        type: 'text',
        title: '',
        data: ''
      });
      this.editing = true;
      this.edit_idx = -1;
      var contentview = new ContentView({model: content});
      contentview.render();
      M.editor.contentview = contentview;
      return false;
    },
    updateContent: function(json) {
      if(!this.editing) {
        return;
      }
      //console.log('updateContent in Pageview');
      var content = this.model.get('content');
      if(this.edit_idx > -1) {
        content[this.edit_idx] = json;
      }
      else {
        content.push(json);
      }

      this.editing = false;
      this.edit_idx = -1;
      this.model.set({'content': content});
      this.render();
    },
    removeContent: function(event) {
      //console.log('recvd remove event..about to process..');
      var content = this.model.get('content');
      var idx = $(event.target).parent().attr('for');
      idx = Number(idx); //is this a correct way of doing it?
      //console.log('remove content: ', content[idx]);
      content.splice(idx, 1);
      this.model.set({'content': content});
      //console.log('after removing: ', this.model.get('content'));
      this.render();
      return false;
    },
    updatePage: function(event) {
      event.preventDefault();
      var name = $('#name').val();
      var title = $('#title').val();
      var categories = $("#categories").val().split(',');
      var tags = $("#tags").val().split(',');
      var children = [];
      //var children = $('#children').val();
      //children = (children === '') ? [] : children.split(',');
      this.model.set({'name': name, 'title': title,
                      'children': children, 'categories':categories,
                      'tags': tags});

      if($('#showNav').is(':checked')) {
        this.model.set({'showNav': true});
      }
      else {
        this.model.set({'showNav': false});
      }

      //code to remove nested page and status fields..a previous commit should
      //fix the issue. the following code is for update data older than the
      //commit. This should update old nested. Can remove after sometime?
      if(this.model.get('page') || this.model.get('status')) {
        this.model.unset('page');
        this.model.unset('status');
      }

      this.model.save({}, {
        success: function(model, response) {
          //console.log('saved', model, response);
          M.editor.hideOverlay();
          //model.set(response.page);
          //model.id = response.page.id;
          //console.log(model);
          M.pagelistview.render();
          M.editor.notifs.show('success', 'Saved', '');
        },
        error: function(model, xhr) {
          M.editor.hideOverlay();
          model.set(response.page);
          console.log('failed', model, xhr);
          var msg = 'Something went wrong, and the page could not be updated';
          M.editor.notifs.show('fail', 'Error!', msg);
        }
      });
      M.editor.showOverlay();
      return false;
    },
    duplicatePage: function(event) {
      event.preventDefault();
      console.log('duplicate page');
      console.log(this.model.toJSON());
      var newpage = new M.types.model.Page({
        name: 'copy-of-' + this.model.get('name'),
        children: this.model.get('children'),
        content: this.model.get('content'),
        showNav: this.model.get('showNav'),
        title: this.model.get('title')
      });
      M.pages.add(newpage);
      //var self = this;
      M.editor.showOverlay();
      newpage.save({}, {success: function(model, response) {
        M.editor.hideOverlay();
        M.pagelistview.render();
        var newpageview = new PageView({model: newpage});
        newpageview.render();
        M.editor.pageview = newpageview;
      }});
    }
  });

  /* view to manage, render and update each content */
  var ContentView = Backbone.View.extend({
    id: 'contentview',
    className: 'prettybox-lg',
    events: {
      'click #done': 'done',
      'click #updateContent': 'update',
      'click #back' : 'back',
      'click #edit-type button' : 'editTypeChanged',
      'change .contentview select': 'typeChanged',
      /* plugin events */
      'click #upload-plugin': 'uploadPlugin'
    },
    initialize: function() {
      _.bindAll.apply(_, [this].concat(_.functions(this)));
      _.bind(this.render, this);

      $('#pages').hide();
      $('#page').hide();
      $('#content-container').append(this.$el);
      this.template = _.template($('#content-template').html());
      this.wysiwyg = true;
    },
    render: function() {
      this.$el.html('');
      var type = this.model.get('type');
      this.$el.append(this.template({
        type: this.model.get('type'),
        title: this.model.get('title'),
        tags: this.model.get('tags')
      }));

      this.$select = $('.contentview select');
      this.$select.val(type);

      if(type === 'text') {
        var template = _.template($('#text-template').html());
        $('#specific-content').html(template({
          wysiwyg: this.wysiwyg,
          data: this.model.get('data')
        }));
        if(this.wysiwyg) {
          $('#edit-type button[value="wysiwyg"]').addClass('active');
          // init the wysiwyg editor
          M.editor.wysiwyg.init('#edit');
        }
        else {
          $('#edit-type button[value="code"]').addClass('active');
          M.editor.code.init('code-edit', 'html');
        }
      }
      else if(type === 'image' || type === 'video' ||
              type === 'audio') {

        var template = _.template($('#media-template').html());
        $('#specific-content').html(template({
          src: this.model.get('src')
        }));

        //TODO: provide the users a preview
        /*var view = new M.types.view[type]({model: this.model});
         //$('#specific-content.preview').html();
         view.render('.preview');*/
      }
      else if(type === 'plugin') {
        var template = _.template($('#plugin-template').html());
        $('#specific-content').html(template({
          src: this.model.get('src'),
          callback: this.model.get('callback')
        }));
        if(this.model.get('src')) {
          var plugin_type = this.model.get('plugin_type');
          plugin_type = (plugin_type === 'js') ? 'javascript' : 'css';
          //console.log('getting code..');
          this.model.getCode(function(data) {
            //console.log('got code..');
            $('#plugin-edit').html(escapeHtml(data));
            M.editor.code.init('plugin-edit', plugin_type);
          });
        }
      }
      else if(type === 'map') {
        var template = _.template($('#map-template').html());
        $('#specific-content').html(template({
          tileLayer: this.model.get('tileLayer'),
          shp: this.model.get('shp')
        }));
      }

      else if(type === 'FeedView') {
        var template = _.template($('#feeds-view-template').html());
        $('#specific-content').html(template({
          dataSrc: this.model.get('dataSrc'),
          containerElement: this.model.get('containerElement'),
          templateElement: this.model.get('templateElement')
          }));
      }
    },
    typeChanged: function(event) {
      var type = this.$select.val();
      //TODO: do validation on type - a list of valid models is in
      //M.types.model
      var base_props = _.keys(new M.types.model.base().defaults);
      var props = _.omit(this.model.toJSON(), base_props);
      var new_model = new M.types.model[type](props);
      this.model = new_model;
      this.model.set({'type': type});
      this.render();
    },
    editTypeChanged: function(event) {
      var type = $(event.currentTarget).val();
      if(type === 'wysiwyg') {
        this.wysiwyg = true;
        this.render();
        $('#edit-type button[value="wysiwyg"]').addClass('active');
      }
      else {
        this.wysiwyg = false;
        this.render();
        $('#edit-type button[value="code"]').addClass('active');
      }
    },
    update: function() {
      var prop, val, new_attrs = {};
      $('#contentview [m-data-target]').each(function(idx, elem) {
        prop = $(elem).attr('m-data-target');
        if(prop === 'tags') {
          val = ($(elem).val()) ? $(elem).val().split(',') : [];
        }
        else {
          val = $(elem).val();
        }
        new_attrs[prop] = val;
      });
      new_attrs['type'] = this.$select.val();
      if(this.$select.val() === 'text') {
        if(this.wysiwyg) {
          var data = M.editor.wysiwyg.save('#edit');
          new_attrs['data'] = data;
        }
        else {
          var data = M.editor.code.save('code-edit');
          new_attrs['data'] = data;
        }
      }
      else if(this.$select.val() === 'plugin') {
        var data = M.editor.code.save('plugin-edit');
        this.model.saveCode(data, function(resp) {
          //console.log('plugin saved..');
        });
      }
      this.model.set(new_attrs);
      //console.log('content updated');
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
    },
    back: function() {
      this.cleanUp();
    },
    //upload inputed plugin file to server
    uploadPlugin: function(event) {
      var self = this;
      M.editor.showOverlay();
      var $form = $('#plugin-upload-form')[0];
      //console.log($form);
      var formdata = new FormData($form);
      //console.log(formdata);
      $.ajax({
        type: 'POST',
        url: M.PluginUploadURL(),
        data: formdata,
        processData: false,
        contentType: false,
        success: function(response) {
          self.model.set({'src': response.path});
          self.render();
          M.editor.hideOverlay();
          //console.log(self.model.toJSON());
        }
      });
    }
  });

  /* view to configure custom navigation menu */
  var MenuConfigView = Backbone.View.extend({
    tagName: 'div',
    className: 'prettybox-lg',
    id: 'page',
    events: {
      'change #custom-menu': 'customMenuChange',
      'click #updateMenu': 'saveMenu'
    },
    initialize: function() {
      _.bindAll.apply(_, [this].concat(_.functions(this)));
      this.template = _.template($('#menu-config-template').html());
    },
    render: function() {
      $('#page').remove();
      this.delegateEvents();
      $('#content-container').append(this.$el);
      //console.log('rendering..', this.$el);
      this.$el.html(this.template({
        menu_order: this.model.get('menuOrder'),
        pos: this.model.get('pos'),
        menu: this.model.get('html')
      }));
      this.$menuOptions = $('.menu-options');
      this.$menuOrder = $('#menu-order-wrap');

      if(this.model.get('customMenu') === true) {
        this.$menuOrder.hide();
        $('#custom-menu').attr('checked', true);
        this.$menuOptions.show({complete: function() {
          M.editor.code.init('menu', 'html');
        }});
      }
    },
    showMenuOptions: function(bool) {
    if(bool === true) {
      this.$menuOrder.hide();
      this.$menuOptions.show({complete: function() {
          M.editor.code.init('menu', 'html');
        }});
      }
      else {
        this.$menuOrder.show();
        this.$menuOptions.hide();
      }
    },
    customMenuChange: function(event) {
      this.$menuOptions = $('.menu-options');
      if($('#custom-menu').is(':checked')) {
        this.model.set({'customMenu': true});
      }
      else {
        this.model.set({'customMenu': false});
      }
      this.showMenuOptions(this.model.get('customMenu'));
    },
    saveMenu: function() {
      //console.log('saving menu..');
      if($('#custom-menu').is(':checked')) {
        //var html = $('#menu').val().trim() || '';
        var html = M.editor.code.save('menu');
        this.model.set({'customMenu': true, 'html': html});
      }
      else {
        var menuOrder = $('#menu-order').val().split(',') || [];
        this.model.set({'customMenu': false, 'menuOrder': menuOrder});
      }
      //console.log('menu model: ', this.model.toJSON());
      this.model.save({}, {
        success: function(model, response) {
          //console.log(model, response);
          M.editor.hideOverlay();
          M.editor.notifs.show('success', 'Saved', '');

        },
        error: function(xhr, response) {
          M.editor.hideOverlay();
          var msg = 'Something went wrong, and the page could not be updated';
          M.editor.notifs.show('fail', 'Error!', msg);
        }
      });
      //alert('end of save menu');
      M.editor.showOverlay();
    }
  });

  /* Footer Config View */
  var FooterConfigView = Backbone.View.extend({
    tagName: 'div',
    className: 'prettybox-lg',
    id: 'page',
    events: {
      'click #updateFooter': 'saveFooter'
    },
    initialize: function() {
      _.bindAll.apply(_, [this].concat(_.functions(this)));
      this.template = _.template($('#footer-config-template').html());
    },
    render: function() {
      $('#page').remove();
      this.delegateEvents();
      $('#content-container').append(this.$el);
      //console.log('rendering..', this.$el);
      this.$el.html(this.template({
        footer: this.model.get('html')
      }));
      M.editor.code.init('footer-input', 'html');
    },
    saveFooter: function() {
      var html = M.editor.code.save('footer-input');
      this.model.set({html: html});
      this.model.save({}, {
        success: function(model, response) {
          //console.log(model, response);
          M.editor.hideOverlay();
          M.editor.notifs.show('success', 'Saved', '');

        },
        error: function(xhr, response) {
          M.editor.hideOverlay();
          var msg = 'Something went wrong, and the page could not be updated';
          M.editor.notifs.show('fail', 'Error!', msg);
        }
      });
      M.editor.showOverlay();
    }
  });

  /* Header Config View */
  var HeaderConfigView = Backbone.View.extend({
    tagName: 'div',
    className: 'prettybox-lg',
    id: 'page',
    events: {
      'click #updateHeader': 'saveHeader'
    },
    initialize: function() {
      _.bindAll.apply(_, [this].concat(_.functions(this)));
      this.template = _.template($('#header-config-template').html());
    },
    render: function() {
      $('#page').remove();
      this.delegateEvents();
      $('#content-container').append(this.$el);
      //console.log('rendering..', this.$el);
      this.$el.html(this.template({
        header: this.model.get('html')
      }));
      M.editor.code.init('header-input', 'html');
    },
    saveHeader: function() {
      var html = M.editor.code.save('header-input');
      this.model.set({html: html});
      this.model.save({}, {
        success: function(model, response) {
          //console.log(model, response);
          M.editor.hideOverlay();
          M.editor.notifs.show('success', 'Saved', '');

        },
        error: function(xhr, response) {
          M.editor.hideOverlay();
          var msg = 'Something went wrong, and the page could not be updated';
          M.editor.notifs.show('fail', 'Error!', msg);
        }
      });
      M.editor.showOverlay();
    }
  });

  /* Notification view */
  var NotificationView = Backbone.View.extend({
    initialize: function(opts) {
      try {
        this.el = opts.el;
      }
      catch(e) {
        throw new Error(this.usage());
        return;
      }
      this.template = _.template($('#notif-template').html());
      this.el = opts.el;
      this.delayTime = opts.delay || 3000; // a default delay value
    },
    render: function(type, title, msg) {
      $(this.el).html(this.template({
        type: (type === 'fail') ? 'danger' : 'success',
        title: title,
        msg: msg
      //autohide the notif after a delay
      })).show(200).delay(this.delayTime).hide(500);
    },
    usage: function() {
      return 'Missing or invalid parameters.\n Valid Params: '+
             '\n@el: (required) a JQuery HTML element, inside which the notifaction'+
             ' will be rendered'+
             '\n@delay: (optional) a delay time, after which the notification'+
             ' will be hidden';
    }
  });

  /* Upload View */
  var UploadView = Backbone.View.extend({
    tagName: 'div',
    className: 'prettybox-lg',
    id: 'page',
    events: {
      'click #upload-new-file': 'uploadFile',
      'click .uploaded-item .remove': 'removeFile'
    },
    initialize: function() {
      _.bindAll.apply(_, [this].concat(_.functions(this)));
      this.template = _.template($('#uploads-template').html());
    },
    render: function() {
      $('#page').remove();
      $('#content-container').append(this.$el);
      //console.log('rendering..', this.$el);
      var uploaded_files, self = this;
      M.editor.showOverlay();
      $.ajax({
        url: '/upload',
        type: 'GET',
        success: function(data) {
          M.editor.hideOverlay();
          self.$el.html(self.template({
          }));
          self.appendFileListTemplate(data.uploaded_files);
          self.delegateEvents();
        }
      });
    },
    appendFileListTemplate: function(files) {
      var template = _.template($('#uploaded-item-template').html());
      if(files.length) {
        _.each(files, function(file) {
          $('#uploads-list').append(template({
            filename: file
          }));
        });
      }
      else {
        $('#uploads-list').html('<b> No files uploaded yet </b>');
      }
    },
    uploadFile: function() {
      //console.log('upload file');
      var self = this;
      M.editor.showOverlay();
      var $form = $('#file-upload-form')[0];
      var formdata = new FormData($form);
      $.ajax({
        type: 'POST',
        url: '/upload',
        data: formdata,
        processData: false,
        contentType: false,
        success: function(response) {
          M.editor.hideOverlay();
          M.editor.notifs.show('success', 'Success', 'File uploaded');
          self.render();
        },
        error: function(jqxhr, status, error) {
          M.editor.hideOverlay();
          if(error === 'BAD REQUEST') {
            var msg = 'File format not allowed. Please contact your administrator to allow this kind of file.'
          } else {
            var msg = 'Something went wrong. Please try again!';
          }
          M.editor.notifs.show('fail', 'Error!', msg);
        }
      });
    },
    removeFile: function(event) {
      M.editor.showOverlay();
      //console.log('remove file');
      var self = this;
      var filename = $(event.currentTarget).attr('for');
      $.ajax({
        type: 'DELETE',
        url: '/upload/' + filename,
        success: function(data) {
          M.editor.hideOverlay();
          self.render();
        },
        error: function(jqxhr, status, error) {
          console.log(arguments);
        }
      });
    }
  });

  /* The global editor object.
   * All high-level editor operations are defined here.
   */
  M.editor = {
    init: function() {
      M.pages = new Pages(M.site_content.content);
      M.pagelistview = new PageListView();
      M.pagelistview.render();
      // initialize the notfications for the editor
      this.notifs.notifview = new NotificationView({
        el: $('#notifications'),
      });
    },
    // the wysiwig editor sub-object
    wysiwyg: {
      init: function($selector) {
        tinymce.init({
          selector: $selector,
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
      },
      save: function($selector) {
        if($($selector).length) {
          tinymce.triggerSave(false, true);
          return $($selector).val();
        }
        return false;
      },
      cleanUp: function($selector) {
      }
    },
    // the code editor
    code: {
      _editor: false,
      init: function(id, mode) {
        var editor = ace.edit(id);
        editor.setTheme('ace/theme/solarized_dark');
        editor.getSession().setMode('ace/mode/'+mode);
        editor.getSession().setTabSize(2);
        editor.getSession().setUseSoftTabs(true);
        editor.getSession().setUseWrapMode(true);
        $('#code-edit').css('fontSize', '13px');
        this._editor = editor;
      },
      save: function(id) {
        var data = this._editor.getValue();
        this._editor.destroy();
        return data;
      },
      cleanUp: function(id) {
      }
    },
    //editor notifications
    notifs: {
      // init the notif view when the DOM is ready, in editor.init
      notifview: null,
      show: function(type, title, msg) {
        this.notifview.render(type, title, msg);
      }
    },
    showOverlay: function() {
      $('#editor-overlay').show();
    },
    hideOverlay: function() {
      $('#editor-overlay').hide();
    }
  };

  var escapeHtml = function(string) {
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
  };
  M.escapeHtml = escapeHtml;

})(M);

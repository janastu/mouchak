#!/usr/bin/python

# Mouchak Server -
# A Flask Application (http://flask.pocoo.org/)

###############################################################################
# TODO: While moving rendering, routing and controlling to server side, the API
# has to change and improve. The API should be as follows:-
# --
# For Pages
#
# [GET] /mouchak/api/v1a/pages/ - Retrieve list of all the pages
# [GET] /mouchak/api/v1a/pages/<id> - Retrieve specfic page
# [POST] /mouchak/api/v1a/pages - Create a new page, with data in payload
# [PUT] /mouchak/api/v1a/pages/<id> - Update a specific page, with data in
# payload
# [DELETE] /mouchak/api/v1a/pages/<id> - Delete a specific page
# --
#
# For Sitemap (There is only one instance of sitemap in a given website, hence
# the API is quite simple.
#
# [GET] /mouchak/api/v1a/sitemap - Retrieve the sitemap
# [PUT] /mouchak/api/v1a/sitemap - Update the sitemap
###############################################################################

import bson
import os
import json
import requests
import logging
import cache
from flask import (Flask, make_response, request, jsonify, session,
                   render_template, redirect, url_for, send_from_directory,
                   flash)
from flask.ext.pymongo import PyMongo
from flaskext.uploads import (UploadSet, configure_uploads, IMAGES,
                              DATA, DOCUMENTS, UploadConfiguration)
from logging import FileHandler
from werkzeug import secure_filename
from utilities import ObjectIdCleaner

PLUGIN_UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)),
                                    'static/user_plugins')
FILE_UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)),
                                  'static/uploads')

plugin_upload = UploadSet('plugins', ('js', 'css'),
                          default_dest=lambda app: app.instance_path)
plugin_upload._config = UploadConfiguration(PLUGIN_UPLOAD_FOLDER)


files_upload = UploadSet('files', IMAGES + DOCUMENTS + DATA + ('pdf',),
                         default_dest=lambda app: app.instance_path)
files_upload._config = UploadConfiguration(FILE_UPLOAD_FOLDER)


app = Flask(__name__)
app.config.from_pyfile('conf.py')
mongo = PyMongo(app)
configure_uploads(app, plugin_upload)
configure_uploads(app, files_upload)
app.register_module(cache.cache, url_prefix='/cache')


bson.ObjId = bson.objectid.ObjectId  # handy reference to otherwise long name


def getContent(key=None):
    """Return a dictionary which contains the content from the particular
    collection.
    If key is None then return all collections.
    """
    content = [i for i in mongo.db.content.find()]
    menu = mongo.db.menu.find_one()
    footer = mongo.db.footer.find_one()
    header = mongo.db.header.find_one()

    if key is not None:
        # FIXME: code might raise exception, but it is left uncaught.  The code
        # will raise exception when 'key' is not in the object being sent.
        return {'content': content, 'menu': menu, 'footer': footer, 'header':
                header}[key]
    else:
        return {'content': content, 'menu': menu, 'footer': footer, 'header':
                header}


@app.before_first_request
def setBeforeRequestHandlers():
    mongo.db.add_son_manipulator(ObjectIdCleaner())
    if mongo.db.menu.find_one() is None:
        mongo.db.menu.insert({'customMenu': False,
                              'menuOrder': [], 'html': ''})

    if mongo.db.footer.find_one() is None:
        mongo.db.footer.insert({'html': ''})

    if mongo.db.header.find_one() is None:
        mongo.db.header.insert({'html': ''})


@app.errorhandler(404)
def pageNotFound(e):
    return render_template('404.html'), 404


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html', content=getContent(),
                           title=app.config.get('SITE_TITLE'))


@app.route('/edit', methods=['GET'])
def edit():
    if "logged_in" in session:
        return render_template('editor.html', content=getContent(),
                               title=app.config.get('SITE_TITLE'))
    else:
        return redirect(url_for('login'))


@app.route('/pages', methods=['GET'])
def listPages():
    # if limit and offset are given as query string params, send pages with
    # that limit starting from the offset.
    # FIXME: this code has CSRF vulnerability.
    # http://pocoo.org/docs/0.10/security/#json-security
    # use jsonify
    if request.args.get('limit'):
        content = []
        limit = int(request.args.get('limit'))
        if request.args.get('offset'):
            offset = int(request.args.get('offset'))
        else:
            offset = 0
            content = [page for page in mongo.db.
                       content.find().sort('id', 1)[offset:offset+limit]]
        return make_response(json.dumps(content), '200 OK',
                             {'Content-Type': 'application/json'})
    else:
        content = getContent('content')
        return make_response(json.dumps(content), '200 OK',
                             {'Content-Type': 'application/json'})


@app.route('/pages/<_id>', methods=['GET'])
def listPage(_id):
    page = mongo.db.content.find_one_or_404({'_id': bson.ObjId(_id)})
    return jsonify(page)


@app.route('/page', methods=['POST'])
def insertPage():
    newpage = request.json
    mongo.db.content.insert(newpage)  # returns objectID of the
    # inserted document.
    newpage['id'] = str(newpage['_id'])
    del(newpage['_id'])
    return jsonify(newpage)


@app.route('/page/<_id>', methods=['PUT', 'DELETE'])
def updatePage(_id):
    if request.method == 'PUT':
        changedPage = request.json
        res = mongo.db.content.update({'_id': bson.ObjId(_id)},
                                      changedPage)
        if 'ok' in res and res['ok'] == 1:
            # return jsonify(status='ok', page=changedPage)
            return jsonify(changedPage)

    elif request.method == 'DELETE':
        #        delPage = request.url
        res = mongo.db.content.remove({'_id': bson.ObjId(_id)})
        if 'err' not in res:
            return jsonify(status='ok')
        else:
            return jsonify(error=res['err'], status='error')


@app.route('/footer', methods=['POST'])
def insertFooter():
    return '200 OK'


@app.route('/footer/<_id>', methods=['PUT'])
def updateFooter(_id):
    if request.method == 'PUT':
        changedFooter = request.json
        print "changed footer:"
        print changedFooter
        res = mongo.db.footer.update({'_id': bson.ObjId(_id)}, changedFooter)
        print res
        return jsonify(changedFooter)


@app.route('/header', methods=['POST'])
def insertHeader():
    return '200 OK'


@app.route('/header/<_id>', methods=['PUT'])
def updateHeader(_id):
    if request.method == 'PUT':
        changedHeader = request.json
        print "changed header:"
        print changedHeader
        res = mongo.db.header.update({'_id': bson.ObjId(_id)}, changedHeader)
        print res
        return jsonify(changedHeader)


@app.route('/menu', methods=['POST'])
def insertMenu():
    # newmenu = request.json
    # print newmenu
    # res = siteMenu.insert(newmenu)
    # print res
    # return jsonify(status='success')# , content=getContent())
    return '200 OK'


@app.route('/menu/<_id>', methods=['PUT'])
def updateMenu(_id):
    if request.method == 'PUT':
        changedMenu = request.json
        print "changed menu:"
        print changedMenu
        res = mongo.db.menu.update({'_id': bson.ObjId(_id)}, changedMenu)
        print res
        # return jsonify(status='ok', menu=changedMenu)
        return jsonify(changedMenu)

    # elif request.method == 'DELETE':
    #     delMenu = request.url
    #     print delMenu
    #     print _id
    #     res = siteMenu.remove({'_id': bson.ObjId(_id)})
    #     return jsonify(status='deleted')


#  Basic login for one single admin user whose credentials are in conf.py
@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        print request.form
        if request.form['username'] != app.config.get('ADMIN_USERNAME'):
            error = 'Invalid username'
        elif request.form['password'] != app.config.get('ADMIN_PASSWORD'):
            error = 'Invaid password'
        else:
            session['logged_in'] = True
            flash('You were logged in')
            return redirect(url_for('edit'))
    return render_template('login.html', error=error)


@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('You were logged out')
    return redirect(url_for('login'))


# TODO: refactor these code to classes
# TODO: find out if this is a good method for saving plugins..
@app.route('/static/user_plugins/<filename>', methods=['POST'])
def savePlugin(filename):
    try:
        plugin_upload.save(request.form.get('code'),
                           name=secure_filename(filename))
        return jsonify(saved=True)

    except:
        resp = make_response()
        resp.status_code = 400
        return resp


# TODO: find out if this is a good method for uploading plugins..
@app.route('/upload/plugin', methods=['POST'])
def uploadPlugin():
    try:
        filename = plugin_upload.save(request.files.get('plugin-file'),
                                      name=secure_filename(request.files.get(
                                          'plugin-file').filename))
        return jsonify(uploaded=True,
                       path=url_for('static',
                                    filename='user_plugins/' +
                                    filename))
    except:
        resp = make_response()
        resp.status_code = 400
        return resp


@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        try:
            filename = files_upload.save(request.files.get('upload-file'),
                                         name=secure_filename(
                                             request.files.get(
                                                 'upload-file').filename))
            return jsonify(uploaded=True,
                           path=url_for('static',
                                        filename='uploads/' +
                                        filename))
        except:
            resp = make_response()
            resp.status_code = 400
            return resp

    if request.method == 'GET':
        uploaded_files = os.listdir(app.config.get('FILE_UPLOAD_FOLDER'))
        return jsonify({'uploaded_files': uploaded_files})


@app.route('/upload/<filename>', methods=['DELETE'])
def removeFile(filename):
    if os.path.isfile(os.path.join(app.config.get('FILE_UPLOAD_FOLDER'),
                                   filename)):
        filepath = os.path.join(app.config.get('FILE_UPLOAD_FOLDER'), filename)
        print filepath
        res = os.remove(filepath)
        print res
        return '200 OK'
    else:
        resp = make_response()
        resp.status_code = 400
        return resp


@app.route('/robots.txt')
@app.route('/crossdomain.xml')
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])


@app.route('/getDB')
def getDB():
    if request.args['dbvar'] == '':
        data = requests.api.get(request.args['url'])
        response = make_response()
        response.data = json.dumps(data.json())
        response.headers['Content-Type'] = 'application/json'
        return response


fil = FileHandler(os.path.join(os.path.dirname(__file__), 'logme'), mode='a')
fil.setLevel(logging.ERROR)
app.logger.addHandler(fil)


if __name__ == "__main__":
    app.run()

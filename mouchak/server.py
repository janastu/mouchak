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

import flask
import pymongo
import bson
import conf
import os
import json
from werkzeug import secure_filename

PLUGIN_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__))
                                    + '/static/user_plugins')
PLUGIN_ALLOWED_EXTENSIONS = set(['js', 'css'])

FILE_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)) +
                                  '/static/uploads')

app = flask.Flask(__name__)



dbClient = pymongo.MongoClient()
db = dbClient[conf.DB]
siteContent = db['content']
siteMenu = db['menu']
if siteMenu.find_one() == None:
    siteMenu.insert({'customMenu': False, 'menuOrder': [], 'html': ''})

siteFooter = db['footer']
if siteFooter.find_one() == None:
    siteFooter.insert({'html': ''})

siteHeader = db['header']
if siteHeader.find_one() == None:
    siteHeader.insert({'html': ''})


# handy reference to otherwise long name
bson.ObjId = bson.objectid.ObjectId


def getContent():
    content = []
    for i in siteContent.find():
        objId = bson.ObjId(i['_id'])
        del(i['_id'])
        i['id'] = str(objId)
        content.append(i)

    menu = siteMenu.find_one()
    objId = bson.ObjId(menu['_id'])
    del(menu['_id'])
    menu['id'] = str(objId)

    footer = siteFooter.find_one()
    objId = bson.ObjId(footer['_id'])
    del(footer['_id'])
    footer['id'] = str(objId)

    header = siteHeader.find_one()
    objId = bson.ObjId(header['_id'])
    del(header['_id'])
    header['id'] = str(objId)

    return {'content': content, 'menu': menu, 'footer': footer, 'header':
            header}


def allowed_file(filename):
    return '.' in filename and \
            filename.rsplit('.', 1)[1] in PLUGIN_ALLOWED_EXTENSIONS


@app.errorhandler(404)
def pageNotFound(e):
    return flask.render_template('404.html'), 404


@app.route('/', methods=['GET'])
def index():
    return flask.render_template('index.html', content=getContent(),
                                 title=conf.SITE_TITLE)


@app.route('/edit', methods=['GET'])
def edit():
    if "logged_in" in flask.session:
        flask.session['key'] = conf.SECRET_KEY
        #print getContent()
        return flask.render_template('editor.html', content=getContent(),
                                     title=conf.SITE_TITLE)
    else:
        return flask.redirect(flask.url_for('login'))


@app.route('/pages', methods=['GET'])
def listPages():
    # if limit and offset are given as query string params,
    # send pages with that limit starting from the offset
    if flask.request.args.get('limit'):
        content = []
        limit = int(flask.request.args.get('limit'))
        if flask.request.args.get('offset'):
            offset = int(flask.request.args.get('offset'))
        else:
            offset = 0
        for page in siteContent.find().sort('_id', 1)[offset:offset+limit]:
            del(page['_id'])
            content.append(page)
        #print len(content)
        return flask.make_response(json.dumps(content), '200 OK',
                                   {'Content-Type': 'application/json'})
    else:
        content = getContent()['content']
        return flask.make_response(json.dumps(content), '200 OK',
                               {'Content-Type': 'application/json'})

@app.route('/pages/<_id>', methods=['GET'])
def listPage(_id):
    try:
        page = siteContent.find_one({'_id': bson.ObjId(_id)})
        del(page['_id'])
        #print page
        return flask.jsonify(page)
    except:
        return flask.abort(404)


@app.route('/page', methods=['POST'])
def insertPage():
    newpage = flask.request.json
    #print newpage
    res = siteContent.insert(newpage)
    _id = bson.ObjId(res)
    newpage['id'] = str(_id)
    del(newpage['_id'])
    #print newpage
    # FIXME: handle errors
    #return flask.jsonify(status='ok', page=newpage)
    return flask.jsonify(newpage)


@app.route('/page/<_id>', methods=['PUT', 'DELETE'])
def updatePage(_id):
    if flask.request.method == 'PUT':
        changedPage = flask.request.json
        print changedPage
        print '======='
        res = siteContent.update({'_id': bson.ObjId(_id)},
                                changedPage)
        print res
        if res['err'] == None:
            print changedPage
            #return flask.jsonify(status='ok', page=changedPage)
            return flask.jsonify(changedPage)

    elif flask.request.method == 'DELETE':
        delPage = flask.request.url
        print delPage
        print _id
        res = siteContent.remove({'_id': bson.ObjId(_id)})
        print res
        if res['err'] == None:
            return flask.jsonify(status='ok')
        else:
            return flask.jsonify(error=res['err'], status='error')


@app.route('/footer', methods=['POST'])
def insertFooter():
    return '200 OK'

@app.route('/footer/<_id>', methods=['PUT'])
def updateFooter(_id):
    if flask.request.method == 'PUT':
        changedFooter = flask.request.json
        print "changed footer:"
        print changedFooter
        res = siteFooter.update({'_id': bson.ObjId(_id)}, changedFooter)
        print res
        return flask.jsonify(changedFooter)

@app.route('/header', methods=['POST'])
def insertHeader():
    return '200 OK'

@app.route('/header/<_id>', methods=['PUT'])
def updateHeader(_id):
    if flask.request.method == 'PUT':
        changedHeader = flask.request.json
        print "changed header:"
        print changedHeader
        res = siteHeader.update({'_id': bson.ObjId(_id)}, changedHeader)
        print res
        return flask.jsonify(changedHeader)


@app.route('/menu', methods=['POST'])
def insertMenu():
    #newmenu = flask.request.json
    #print newmenu
    #res = siteMenu.insert(newmenu)
    #print res
    #return flask.jsonify(status='success')#, content=getContent())
    return '200 OK'


@app.route('/menu/<_id>', methods=['PUT'])
def updateMenu(_id):
    if flask.request.method == 'PUT':
        changedMenu = flask.request.json
        print "changed menu:"
        print changedMenu
        res = siteMenu.update({'_id': bson.ObjId(_id)}, changedMenu)
        print res
        #return flask.jsonify(status='ok', menu=changedMenu)
        return flask.jsonify(changedMenu)

    #elif flask.request.method == 'DELETE':
    #    delMenu = flask.request.url
    #    print delMenu
    #    print _id
    #    res = siteMenu.remove({'_id': bson.ObjId(_id)})
    #    return flask.jsonify(status='deleted')


# Basic login for one single admin user whose credentials are in conf.py
@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if flask.request.method == 'POST':
        print flask.request.form
        if flask.request.form['username'] != conf.ADMIN_USERNAME:
            error = 'Invalid username'
        elif flask.request.form['password'] != conf.ADMIN_PASSWORD:
            error = 'Invaid password'
        else:
            flask.session['logged_in'] = True
            flask.session['key'] = conf.SECRET_KEY
            flask.flash('You were logged in')
            return flask.redirect(flask.url_for('edit'))
    return flask.render_template('login.html', error=error)

@app.route('/logout')
def logout():
    flask.session.pop('logged_in', None)
    flask.flash('You were logged out')
    return flask.redirect(flask.url_for('login'))


#TODO: refactor these code to classes
#TODO: find out if this is a good method for saving plugins..
@app.route('/static/user_plugins/<filename>', methods=['POST'])
def savePlugin(filename):
    if flask.request.method == 'POST':
        if filename and allowed_file(filename):
            data = flask.request.form['code']
            filename = secure_filename(filename)
            fh = open(os.path.join(PLUGIN_UPLOAD_FOLDER + '/' + filename), 'w')
            fh.write(data)
            fh.close()
            return flask.jsonify(saved = True)

#TODO: find out if this is a good method for uploading plugins..
@app.route('/upload/plugin', methods=['POST'])
def uploadPlugin():
    if flask.request.method == 'POST':
        print flask.request.files
        file = flask.request.files['plugin-file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['PLUGIN_UPLOAD_FOLDER'],
                                   filename))

            #return flask.redirect(flask.url_for('uploaded_file',
            #            filename=filename))
            return flask.jsonify(uploaded = True,
                                 path=flask.url_for('static', filename =
                                                    'user_plugins/'+ filename))

@app.route('/robots.txt')
@app.route('/crossdomain.xml')
def static_from_root():
    return flask.send_from_directory(app.static_folder, request.path[1:])


app.config.from_object(conf)
app.config['PLUGIN_UPLOAD_FOLDER'] = PLUGIN_UPLOAD_FOLDER

import logging,os
from logging import FileHandler

fil = FileHandler(os.path.join(os.path.dirname(__file__),'logme'),mode='a')
fil.setLevel(logging.ERROR)
app.logger.addHandler(fil)



if __name__ == "__main__":
    app.run(debug=True, host=conf.HOST, port=conf.PORT)


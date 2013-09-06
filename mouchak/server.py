#!/usr/bin/python

# Mouchak Server -
# A Flask Application (http://flask.pocoo.org/)

import flask
import pymongo
import bson
import conf

app = flask.Flask(__name__)



dbClient = pymongo.MongoClient()
db = dbClient[conf.DB]
siteContent = db['content']
siteMenu = db['menu']
if siteMenu.find_one() == None:
    siteMenu.insert({'customMenu': False, 'menuOrder': []})


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

    return {'content': content, 'menu': menu}



@app.route('/', methods=['GET'])
def index():
    return flask.render_template('index.html', content=getContent(),
                                 title=conf.SITE_TITLE, footer=conf.SITE_FOOTER)


@app.route('/edit', methods=['GET'])
def edit():
    if "logged_in" in flask.session:
        flask.session['key'] = conf.SECRET_KEY
        return flask.render_template('editor.html', content=getContent(),
                                     title=conf.SITE_TITLE)
    else:
        return flask.redirect(flask.url_for('login'))


@app.route('/page', methods=['POST'])
def insertPage():
    newpage = flask.request.json
    print newpage
    res = siteContent.insert(newpage)
    _id = bson.ObjId(res)
    newpage['id'] = str(_id)
    del(newpage['_id'])
    print newpage
    # FIXME: handle errors
    return flask.jsonify(status='ok', page=newpage)


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
            return flask.jsonify(status='ok', page=changedPage)

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
        return flask.jsonify(status='ok', menu=changedMenu)

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

@app.route('/robots.txt')
@app.route('/crossdomain.xml')
def static_from_root():
    return flask.send_from_directory(app.static_folder, request.path[1:])


app.config.from_object(conf)

import logging,os
from logging import FileHandler

fil = FileHandler(os.path.join(os.path.dirname(__file__),'logme'),mode='a')
fil.setLevel(logging.ERROR)
app.logger.addHandler(fil)



if __name__ == "__main__":
    app.run(debug=True, host=conf.HOST, port=conf.PORT)


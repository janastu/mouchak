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
    siteMenu.insert({'customMenu': False})

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
                                 title=conf.SITE_TITLE)


@app.route('/edit', methods=['GET'])
def edit():
    return flask.render_template('editor.html', content=getContent(),
                                 title=conf)


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


#@app.route('/menu', methods=['POST'])
#def insertMenu():
#    newmenu = flask.request.json
#    print newmenu
#    res = siteMenu.insert(newmenu)
#    print res
#    return flask.jsonify(status='success')#, content=getContent())
#

@app.route('/menu/<_id>', methods=['PUT'])
def updateMenu(_id):
    if flask.request.method == 'PUT':
        changedMenu = flask.request.json
        print changedMenu
        res = siteMenu.update({'_id': bson.ObjId(_id)}, changedMenu)
        print res
        return flask.jsonify(status='ok',menu=changedMenu)

    #elif flask.request.method == 'DELETE':
    #    delMenu = flask.request.url
    #    print delMenu
    #    print _id
    #    res = siteMenu.remove({'_id': bson.ObjId(_id)})
    #    return flask.jsonify(status='deleted')


if __name__ == "__main__":
    app.run(debug=True, host=conf.HOST, port=conf.PORT)


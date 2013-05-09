#!/usr/bin/python
# Mouchak Server -
# A Flask Application (http://flask.pocoo.org/)

import flask
import pymongo
import bson

app = flask.Flask(__name__)

dbClient = pymongo.MongoClient()
db = dbClient['mouchak']
collection = db['content']
# handy reference to otherwise long name
bson.ObjId = bson.objectid.ObjectId

def getContent():
    content = []
    for i in collection.find():
        objId = bson.ObjId(i['_id'])
        del(i['_id'])
        i['id'] = str(objId)
        content.append(i)
    return content


@app.route('/', methods=['GET'])
def index():
    return flask.render_template('index.html', content=getContent())


@app.route('/edit', methods=['GET', 'POST'])
def edit():
    if flask.request.method == 'GET':
        return flask.render_template('editor.html', content=getContent())

    elif flask.request.method == 'POST':
        newpage = flask.request.json
        print newpage
        res = collection.insert(newpage)
        print res
        return flask.jsonify(status='success')#, content=getContent())

    
@app.route('/edit/<_id>', methods=['PUT', 'DELETE'])
def editPage(_id):
    if flask.request.method == 'PUT':
        changedPage = flask.request.json
        print changedPage
        res = collection.update({'_id' : bson.ObjId(_id)},
                                changedPage)
        print res
        #print collection.find({'name': changed['name']})
        #for i in collection.find({'name': changed['name']}):
            #print i
        return flask.jsonify(status='success')#, content=getContent())

    elif flask.request.method == 'DELETE':
        delPage = flask.request.url
        print delPage
        print _id
        res = collection.remove({'_id': bson.ObjId(_id)})
        print res
        return flask.jsonify(status='success', msg='removed')


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')


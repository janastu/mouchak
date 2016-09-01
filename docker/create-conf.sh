#!/bin/bash
set -e

: ${MONGO_DBNAME:=mouchak}
: ${MONGO_HOST:=mongo}
: ${MONGO_PORT:=27017}

: ${MOUCHAK_SITE:=Mouchak Site}
: ${MOUCHAK_USER:=admin}
: ${MOUCHAK_PASSWORD:=password}

secret_key=`python -c 'import uuid; print uuid.uuid1()'`

cat > /app/conf.py << EOL
import os

MONGO_DBNAME='$MONGO_DBNAME'
MONGO_HOST='$MONGO_HOST'
MONGO_PORT='$MONGO_PORT'
SITE_TITLE='$MOUCHAK_SITE'
SITE_FOOTER= '''
<div style="text-align: center;">
    <small>Place your footer here</small>
</div>
'''
HOST='0.0.0.0'
PORT='5000'

DEBUG=True
SECRET_KEY='$secret_key'
ADMIN_USERNAME='$MOUCHAK_USER'
ADMIN_PASSWORD='$MOUCHAK_PASSWORD'

SEARCH=False
SEARCH_SITE='http://pensieve.pantoto.org'
INDEX_UPDATE='/update/index_name/doc_name'

PLUGIN_UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'static/user_plugins')
FILE_UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'static/uploads')

ALLOWED_EXTENSIONS = set(['js','css'])

EOL

exec "$@"

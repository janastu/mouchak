import os

MONGO_DBNAME = 'mouchak_test'
SITE_TITLE = 'Testing Mouchak'
SITE_FOOTER = '''
<div style="text-align: center;">
    <small> Place your site footer here </small>
</div>
'''
HOST = '127.0.0.1'
PORT = 5000
DEBUG = True  # Set false for production
SECRET_KEY = 'a-uuid-string-see-python-uuid'
ADMIN_USERNAME = 'youradminusername'
ADMIN_PASSWORD = 'youradminpassword'
SEARCH = False  # Set true if you want to enable search on website
SEARCH_SITE = 'http://pensieve.pantoto.org'
INDEX_UPDATE = '/update/index_name/doc_name'  """Look at elastic search docs
for more information"""
# DO NOT CHANGE THE FOLLOWING VARIABLES
PLUGIN_UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)),
                                    'static/user_plugins')
FILE_UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)),
                                  'static/uploads')
ALLOWED_EXTENSIONS = set(['js', 'css'])
from flask import Module
from urlparse import urlparse
import os
import epeg
import requests
import flask

cache = Module(__name__, name="cache")


@cache.route('/')
def create_cache():
    """cache the image at the url passed in query params.
    width and height of the thumbnail can be specified in the params.
    return cached image thereafter."""
    if 'width' in flask.request.args:
        width = int(flask.request.args['width'])
    else:
        width = 300

    if 'height' in flask.request.args:
        height = int(flask.request.args['height'])
    else:
        height = 300

    dirn = urlparse(flask.request.args['url']).netloc
    dirn = os.path.join('cache', dirn)  # Store cache under a directory
    f = urlparse(flask.request.args['url']).path.split(
        '/')[-1]  # Name of the file
    fp = os.path.join(dirn, f)
    fp = os.path.abspath(fp)  # Get absolute path of the file

    if(os.path.isdir(dirn)):
        if os.path.isfile(fp):
            """if the image is already cached, serve it"""
            with open(fp, 'r') as f:
                image = f.read()
        else:
            """cache a low res version of the image"""
            image = create_thumbnail(flask.request.args['url'], fp, width,
                                     height)
    else:
        """Create a directory with the hostname"""
        os.makedirs(dirn)
        image = create_thumbnail(flask.request.args['url'], fp, width, height)
    return image


def create_thumbnail(url, fp, width, height):
    image = requests.get(url)
    with open(fp, 'w') as f:
        f.write(image.content)
    thumbnail = epeg.scale_image(fp.encode('unicode-escape'),
                                 width, height, 70)
    os.remove(fp)  # Remove the file and write the thumbnail data
    with open(fp, 'w') as f:
        f.write(thumbnail)
    return thumbnail

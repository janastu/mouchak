#!/usr/bin/python

# Read Mouchak Configuration


import re

def readConfig():
    confFile = 'mouchak.conf'
    fh = open(confFile, 'r')
    contents = fh.read()

    match = re.search('DB=(.*)', contents)
    dbName = match.group(1)
    match = re.search('SITE_TITLE=(.*)', contents)
    title = match.group(1)
    match = re.search('HOST=(.*)', contents)
    host = match.group(1)
    match = re.search('PORT=(.*)', contents)
    port = match.group(1)

    return {'db': dbName, 'site_title': title, 'host': host, 'port': int(port)}

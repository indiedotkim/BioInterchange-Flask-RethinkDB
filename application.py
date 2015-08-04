#!/usr/bin/env python

import json

# MongoDB: 
#import pymongo
#from pymongo import MongoClient
#client = MongoClient()
#db = client.genomics
#c = db.demo
#use_mongo = True

# RethinkDB:
import rethinkdb as r
conn = r.connect('localhost', 28015)
use_mongo = False

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

@app.route('/')
def ui():
    return render_template('ui.html')

@app.route('/query', methods=['POST'])
def query():
    if request.method == 'POST':
        content = request.json
        if use_mongo == True:
            docs = list(c.find(json.loads(content['constraint'])) \
                            .skip(int(content['offset'])) \
                            .limit(int(content['limit'])))
        else:
            docs = list(r.db('genomics').table('demo') \
                            .filter(json.loads(content['constraint'])) \
                            .skip(int(content['offset'])) \
                            .limit(int(content['limit'])).run(conn))
        for doc in docs:
            if '_id' in doc:
                del doc['_id']
            if 'uid' in doc:
                del doc['uid']

        result = { 'result' : docs }

        return jsonify(result)

if __name__ == '__main__':
    app.run()


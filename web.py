import os

from flask import Flask, render_template, url_for, redirect, request, session, jsonify
from rdio.rdio import Rdio

app = Flask(__name__)
app.secret_key = os.environ.get('APP_SECRET')

rdio_key = os.environ.get('RDIO_API_KEY')
rdio_secret = os.environ.get('RDIO_API_SECRET')

@app.route('/')
def index():
  return render_template('index.html')

def get_rdio_api():
  api = Rdio((rdio_key, rdio_secret))
  return api

@app.route('/get_albums')
def get_albums():
  api = get_rdio_api()

  params = dict([part.split('=') for part in request.query_string.split('&')])

  offset = params['offset']
  source_type = params['type']
  user = params.get('user')
  user_key = None
  count = 50

  if user and source_type != 'top':
    user_result = api.call('findUser', {
      'vanityName': user,
      'extras': '-*,key'
    })
    # TODO handle user not found
    user_key = user_result['result']['key']

  if source_type == 'collection' and user:
    result = api.call('getAlbumsInCollection', {
      'user': user_key,
      'start': offset,
      'extras': '-*,albumKey,icon',
      'count': count
    })
    # add key items (since we look for 'key' not 'albumKey' in js
    [a.update({'key': a['albumKey']}) for a in result['result']]
  elif source_type == 'heavyrotation' and user:
    result = api.call('getHeavyRotation', {
      'user': user_key,
      'start': offset,
      'count': count,
      'type': 'albums'
    })
  elif source_type == 'friendsheavyrotation' and user:
    result = api.call('getHeavyRotation', {
      'user': user_key,
      'start': offset,
      'count': count,
      'type': 'albums',
      'friends' :'true'
    })
  else: # top albums
    result = api.call('getTopCharts', {
      'type': 'Album',
      'extras': '-*,key,icon',
      'start': offset,
      'count': count
    })

  albums = result['result']
  return jsonify(albums=albums)

if __name__ == '__main__':
  port = int(os.environ.get('PORT', 5000))
  app.run(host='0.0.0.0', port=port, debug=True)

import os

from flask import Flask, render_template, url_for, redirect, request, session, jsonify
from rdio.rdio import Rdio

app = Flask(__name__)
app.secret_key = os.environ.get('APP_SECRET')

rdio_key = os.environ.get('RDIO_API_KEY')
rdio_secret = os.environ.get('RDIO_API_SECRET')

@app.route('/')
def index():
  api = get_rdio_api()

  # if there's a token, the user is logged in
  if api.token:
    result = api.call('currentUser', { 'extras': '-*,key' })
    return render_template('index.html', logged_in_key=result['result']['key'])

  return render_template('index.html')

def get_rdio_api():
  """ create user-specific or generic rdio api """
  token = session.get('at')
  secret = session.get('ats')
  if token and secret:
    api = Rdio((rdio_key, rdio_secret), (token, secret))
  else:
    api = Rdio((rdio_key, rdio_secret))
  return api

def get_playback_token():
  """ returns a playback token for the flash player """
  token = cache.get('playback_token')
  if token:
    return token

  api = get_rdio_api()
  result = api.call('getPlaybackToken', { 'domain': request.host.split(':')[0] })
  playback_token = result['result']
  cache.set('playback_token', playback_token, 600)
  return playback_token

@app.route('/get_albums')
def get_albums():
  api = get_rdio_api()

  params = dict([part.split('=') for part in request.query_string.split('&')])

  offset = params['offset']

  result = api.call('getHeavyRotation', {
    'user': params['key'],
    'extras': '-*,key,icon',
    'start': offset,
    'count': 50,
  })

  albums = result['result']
  return jsonify(albums=albums)

@app.route('/login')
def login():
  api = get_rdio_api()

  callback_url = request.host_url + url_for('login_callback')[1:]
  url = api.begin_authentication(callback_url)

  session['rt'] = api.token[0]
  session['rts'] = api.token[1]

  return redirect(url)

@app.route('/login_callback')
def login_callback():
  params = dict([part.split('=') for part in request.query_string.split('&')])
  token = session['rt']
  secret = session['rts']
  api = Rdio((rdio_key, rdio_secret), (token, secret))
  api.complete_authentication(params.get('oauth_verifier'))
  session['rt'] = None
  session['rts'] = None
  session['at'] = api.token[0]
  session['ats'] = api.token[1]
  return redirect(url_for('index'))

@app.route('/logout')
def logout():
  session['rt'] = None
  session['rts'] = None
  session['at'] = None
  session['ats'] = None
  return redirect(url_for('index'))

if __name__ == '__main__':
  port = int(os.environ.get('PORT', 5000))
  app.run(host='0.0.0.0', port=port, debug=True)

# (c) 2011 Rdio Inc
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

from om import om
import urllib2, urllib
from urlparse import parse_qsl
try:
  import json
except ImportError:
  import simplejson as json

class Rdio:
  def __init__(self, consumer, token=None):
    self.__consumer = consumer
    self.token = token

  def __signed_post(self, url, params):
    auth = om(self.__consumer, url, params, self.token)
    req = urllib2.Request(url, urllib.urlencode(params), {'Authorization': auth})
    res = urllib2.urlopen(req)
    return res.read()

  def begin_authentication(self, callback_url):
    # request a request token from the server
    response = self.__signed_post('http://api.rdio.com/oauth/request_token',
      {'oauth_callback': callback_url})
    # parse the response
    parsed = dict(parse_qsl(response))
    # save the token
    self.token = (parsed['oauth_token'], parsed['oauth_token_secret'])
    # return an URL that the user can use to authorize this application
    return parsed['login_url'] + '?oauth_token=' + parsed['oauth_token']

  def complete_authentication(self, verifier):
    # request an access token
    response = self.__signed_post('http://api.rdio.com/oauth/access_token',
        {'oauth_verifier': verifier})
    # parse the response
    parsed = dict(parse_qsl(response))
    # save the token
    self.token = (parsed['oauth_token'], parsed['oauth_token_secret'])

  def call(self, method, params=dict()):
    # make a copy of the dict
    params = dict(params)
    # put the method in the dict
    params['method'] = method
    # call to the server and parse the response
    return json.loads(self.__signed_post('http://api.rdio.com/1/', params))


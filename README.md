artflip
=======

It's like the iTunes album art screensaver, but for Rdio.

Try it out
----------

artflip is running on heroku at [http://artflip.herokuapp.com](http://artflip.herokuapp.com)

Screensaver
-----------

You may be thinking, "of course, this is all fine but it's not much of a screensaver!" Alas, you are correct, for this is a mere web app that runs in a mere web browser. So I have created a companion project, [ArtFlipSaver](https://github.com/endenizen/ArtFlipSaver) which loads the hosted version of this app in a webview. It also includes some handy options like customizing the number of rows, delay, and album art source (collection, heavy rotation, etc).

Install the screensaver here: [https://dl.dropbox.com/u/120686/ArtFlipSaver.saver.zip](https://dl.dropbox.com/u/120686/ArtFlipSaver.saver.zip)

How does it work?
-----------------

The backend is a flask app that communicates with the rdio api. The front end is javascript that requests the data, arranges the images and juggles css classes which perform the actual flipping using webkit css transitions. The 'options' from the screensaver are passed in the url like so:

    http://artflip.herokuapp.com/#user=endenizen;type=top;rows=3;delay=3

Installation
------------

Create a virtualenv*

    virtualenv ENV

Activate it

    source ENV/bin/activate

Install dependencies

    pip install -r requirements.txt

Generate a secret (you can use 'bla' for local purposes). [More info](http://flask.pocoo.org/docs/quickstart/) on flask setup.

    >>> import os
    >>> os.urandom(24)
    '\xfd{H\xe5<\x95\xf9\xe3\x96.5\xd1\x01O<!\xd5\xa2\xa0\x9fR"\xa1\xa8'

Get an Rdio api key and secret from the [Rdio developer site](http://developer.rdio.com/)

Create env.sh

    export APP_SECRET=your_secret
    export RDIO_API_KEY=your_rdio_api_key
    export RDIO_API_SECRET=your_rdio_api_secret

Activate env vars

    source env.sh

Run app

    python web.py

That's it! Now (if all went accordingly) you're running the app locally and you can access it through:

    http://localhost:5000

A note on virtual env's
-----------------------

If you don't yet have a virtualenv routine, why not start now! A virtualenv keeps packages for a certain app separate from your system packages. They're installed into the directory you specify (I used 'ENV' but you can name it anything) and they're activated with the source command. You can even create a virtualenv for a different version of python, in case you are using packages that don't support the latest version. Finally, remember that your virtualenv is your own, and shouldn't be checked into git. I personally use a global gitignore file to make this easy. For more info, and more customization, check out the [documentation](http://www.virtualenv.org/en/latest/index.html).

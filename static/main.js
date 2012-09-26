(function() {

var App = function(options) {
  this.options = options;

  _.defaults(this.options, {
    rows: 3,
    delay: 3,
    type: 'top',
    username: null
  });

  // Never load more than this many albums
  this.ALBUM_LIMIT = 500;

  this.albums = [];
  // Album lookup of key -> this.albums index
  this.albumLookup = {};
  this.init();
};

App.prototype.init = function() {
  // Setup initial size and bind resize
  $(window).on('resize', _.bind(this.resize, this));
  this.resize();

  this.content = $('#content .container');

  $('#control_toggle').on('click', _.bind(this.showControls, this));
  $('#content').on('click', _.bind(this.hideControls, this));

  $('#controls .rows_submit').on('click', _.bind(this.changeRows, this));

  this.getAlbums(_.bind(this.startFlip, this));
};

App.prototype.changeRows = function() {
  this.options.rows = parseInt($('#controls .rows').val());
  this.startFlip();
  return false;
};

App.prototype.showControls = function() {
  $('#controls .rows').val(this.options.rows);
  $('#controls').show();
  $('#control_toggle').hide();
  return false;
};

App.prototype.hideControls = function(e) {
  if ($(e.target).closest('#controls').length > 0) {
    return;
  }
  $('#controls').hide();
  $('#control_toggle').show();
  return false;
};

// Add album to albums array if it doesn't exist already
// Return true if album was added
App.prototype.addAlbum = function(album) {
  if (!this.albumLookup[album.key]) {
    this.albumLookup[album.key] = this.albums.length;
    this.albums.push(album);
    return true;
  }
};

// Get list of albums from `get_albums` api. Keep scraping
// while incrementing `offset` until we get a response with
// no new albums. Call `k` when done loading albums.
App.prototype.getAlbums = function(k) {
  var that = this;
  // Scan collection
  function getChunk() {
    $.ajax({
      url: '/get_albums',
      data: {
        type: that.options.type,
        user: that.options.user,
        offset: that.albums.length
      },
      success: function(result) {
        var albums = result.albums;
        var added = 0;

        _.each(albums, function(album) {
          added += !!that.addAlbum(album) ? 1 : 0;
        });

        // If we added at least one album, we got new data, otherwise, we might be looping! So just get started.
        // Also, don't get more than `ALBUM_LIMIT` albums.
        if (added > 0 && that.albums.length < that.ALBUM_LIMIT) {
          getChunk();
        } else {
          k();
        }
      }
    });
  }

  getChunk();
};

App.prototype.startFlip = function() {
  this.started = true;

  if (this.flipTimeout) {
    clearTimeout(this.flipTimeout);
    this.flipTimeout = null;
  }

  // Clear out existing images
  this.content.find('img').remove();

  // Width/height of each image
  this.size = Math.ceil(window.innerHeight / this.options.rows);

  var colCount = window.innerWidth / this.size;

  // We'll need to make a full column out of the remainder
  // as well as add an extra that appears on the other side
  this.cols = 1 + Math.ceil(colCount);

  // Adjust canvas
  var leftover = this.size * (colCount - this.cols + 2);
  var adjust = this.size - Math.floor(leftover / 2);
  this.content.css({
    left: -adjust
  });

  this.grid = [];

  for (var i = 0; i < this.options.rows; i++) {
    this.grid[i] = [];
    for (var j = 0; j < this.cols; j++) {
      // Assign random album index to this grid location
      var index = this.randInt(this.albums.length);
      this.grid[i][j] = {
        albumIndex: index,
        image: $('<div class="album"></div>').css({
          top: i * this.size,
          left: j * this.size
        }).append('<img src="' + this.getAlbumArt(index) + '" width="' + this.size + '" height="' + this.size + '" />')
      };
      this.content.append(this.grid[i][j].image);
    }
  }

  this.flipTime();
};

App.prototype.getAlbumArt = function(index) {
  var icon = this.albums[index].icon;
  if (this.size > 600) {
    icon = icon.replace('200', '1200');
  } else if (this.size > 200) {
    icon = icon.replace('200', '600');
  }
  return icon;
};

App.prototype.flipTime = function() {
  var that = this;

  var col = this.randInt(this.cols);
  var row = this.randInt(this.options.rows);
  var dir = this.randInt(2) === 1 ? 'l' : 'r';
  var newAlbumIndex = this.randInt(this.albums.length);

  var curImage = this.grid[row][col].image;
  curImage.addClass('flipping' + dir);

  var newImage = $('<div class="album flipped' + dir + '"></div>').css({
    top: row * this.size,
    left: col * this.size
  }).append('<img src="' + this.getAlbumArt(newAlbumIndex) + '" width="' + this.size + '" height="' + this.size + '" />');
  this.content.append(newImage);

  // Set reference to newly created image
  this.grid[row][col].image = newImage;

  this.cleanupTimeout = setTimeout(function() {
    newImage.removeClass('flipped' + dir);
    curImage.remove();
  }, 1000);

  this.flipTimeout = setTimeout(_.bind(this.flipTime, this), this.options.delay * 1000);
};

App.prototype.randInt = function(c) {
  return Math.floor(Math.random() * c);
};

App.prototype.resize = function() {
  var newWidth = window.innerWidth;
  var newHeight = window.innerHeight;

  if (newWidth != this.prevWidth || newHeight != this.prevHeight) {
    this.prevWidth = newWidth;
    this.prevHeight = newHeight;

    // dimensions changed, re-render (only if already rendered once)
    if (this.started) {
      this.startFlip();
    }
  }
};

App.prototype.destroy = function() {
  // coming soon...
  if (this.flipTimeout) {
    clearTimeout(this.flipTimeout);
    this.flipTimeout = null;
  }
  if (this.cleanupTimeout) {
    clearTimeout(this.cleanupTimeout);
    this.cleanupTimeout = null;
  }
  this.content.empty();
};

window.app = null;

function setupApp() {
  if (window.app) {
    window.app.destroy();
    window.app = null;
  }
  var options = {};
  var parts;
  try {
    parts = window.location.hash.substring(1).split(';');
    _.each(parts, function(part) {
      var option = part.split('=');
      options[option[0]] = option[1];
    });
  } catch (e) {
    options = {};
  }
  window.app = new App(options);
}

$(document).ready(function() {
  setupApp();
  $(window).on('hashchange', setupApp);
});

})();

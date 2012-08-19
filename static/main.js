(function() {

var App = function(user) {
  // Never load more than this many albums
  this.ALBUM_LIMIT = 10;

  this.user = user;
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

  this.getAlbums(_.bind(this.startFlip, this));
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
        key: that.user,
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

  this.rows = 3;

  // Clear out existing images
  this.content.find('img').remove();

  // Width/height of each image
  this.size = Math.ceil(window.innerHeight / this.rows);

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

  for (var i = 0; i < this.rows; i++) {
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
  var row = this.randInt(this.rows);
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

  setTimeout(function() {
    newImage.removeClass('flipped' + dir);
    curImage.remove();
  }, 1000);

  // 1.5 to 6.5 second delay till next flip.
  var time = Math.random() * 5000 + 1500;
  time = 1200;
  this.flipTimeout = setTimeout(_.bind(this.flipTime, this), time);
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

$(document).ready(function() {
  if (window.logged_in_key) {
    window.app = new App(window.logged_in_key);
  }
});

})();

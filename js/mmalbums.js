var url = window.location.href;
var child_nid = url.split("?")[1];
child_nid = child_nid.split("&")[0];
child_nid = child_nid.split("=")[1];
window.localStorage.setItem('album_refresh_'+child_nid,'yes');
document.addEventListener("deviceready", mmalbumsOnload, false);

function mmalbumsOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", mmalbumsBackbutton, false);
  setTimeout(checkConnection(),100);
  var db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(getAlbumsfromDB,errorfn,successfn);
}

function mmalbumsBackbutton() {
  navigator.app.backHistory();
}

function mmalbumsRefresh() {
  albumsRetrieve('refresh');
  albumsDelete();
}

function checkConnection() {
  var networkState = navigator.connection.type;
  if(networkState == 'none') {
    $('#offline').show();
  }
  else {
    $('#offline').hide();
  }
}

function getAlbumsfromDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS ALBUMS(nid INT NOT NULL,title,body,posted_on,timestamp,like,likescount,cover_thumbnail,child_nid INT NOT NULL,PRIMARY KEY(child_nid,nid))');
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM ALBUMS WHERE child_nid="' +child_nid+ '" order by timestamp DESC',[],printAlbums,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM ALBUMS WHERE child_nid="' +child_nid+'"',[],setMaxTimestamp,errorfn);
}

function printAlbums(tx, results) {
  if(results.rows.length > 0) {
    var album_nids = '';
    var output = '';
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      var album_refresh = window.localStorage.getItem('album_refresh_'+child_nid);
      var album_timestamp = window.localStorage.getItem('album_timestamp_'+child_nid);
      if(album_refresh == 'yes' && album_timestamp != null) {
        albumsRetrieve('refresh');
      }
    }
    $.mobile.loading('show');
    for(var i=0; i<results.rows.length; i++) {
      album_nids += results.rows.item(i).nid +',';
      output += '<li><a id="'+results.rows.item(i).nid+'" href="#"><div class="container">';
      output += '<img class="mm_album_cover_photo" src="'+results.rows.item(i).cover_thumbnail+'"/>';
      if(results.rows.item(i).title.length > 25) {
        var title = unescape(results.rows.item(i).title).substring(0,25) + '...';
      }
      else {
        var title = unescape(results.rows.item(i).title);
      }
      if(results.rows.item(i).body == 'null') {
        output += '<div class="mm_album_title" style="margin-top:18px !important;">'+title+'</div>';
      }
      else {
        output += '<div class="mm_album_title">'+title+'</div>';
      }
      output += '<div class="mm_posted_on">'+results.rows.item(i).posted_on+'</div>';
      if(results.rows.item(i).body != 'null') {
        var body = unescape(results.rows.item(i).body);
        body = body.replace(/(<([^>]+)>)/ig,""); // Trim HTML Tags
        if(body.length > 350) {
          body = body.substr(0,350) + '...';
        }
        output += '<div class="mm_album_desc">'+body+'</div>';
      }
      output += '</div></a></li>';
    }
    window.localStorage.setItem('album_nids_'+child_nid,album_nids);
    $("#mm_albums ul").html(output).listview('refresh');
    $.mobile.loading('hide');
    //Scroll to prev read album position
    var album_prev_back_pos = Number(window.localStorage.getItem('album_prev_back_pos'));
    if(album_prev_back_pos != 0) {
      $.mobile.silentScroll(album_prev_back_pos);
    }
  }
  else {
    if(window.localStorage.getItem('albums_full_fetch_'+child_nid) == null) {
      var networkState = navigator.connection.type;
      if(networkState != 'none') {
        albumsRetrieve('swipe');
      }
    }
    else if(window.localStorage.getItem('albums_full_fetch_'+child_nid) == 'YES') {
      coolgalert("No Albums");
      return false;
    }
  }
}

function setMaxTimestamp(tx,results) {
  $.each(results.rows.item(0), function(key,value){
    window.localStorage.setItem('album_timestamp_'+child_nid,value);
  });
}

function getuidSuccess(tx,results) {
  uid = results.rows.item(0).uid ;
}

function errorfn(err) {
  console.log("Error in SQL:" + err.code);
}

function successfn() {
  console.log("Connected to Database successfully");
}

function successdb() {
  console.log("Database has been created successfully");
}

$(document).on('click', '#albums_list li a', function () {
  window.localStorage.setItem('album_prev_back_pos',$(this).offset().top);
  window.location = "mmphotos.html?child_nid="+child_nid +"&album_nid="+$(this).attr('id');
});

function storeAlbums(data) {
  var storage = window.localStorage;
  storage.setItem('albums',JSON.stringify(data));
}

function createDB() {
  var db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS ALBUMS(nid INT NOT NULL,title,body,posted_on,timestamp,like,likescount,cover_thumbnail,child_nid INT NOT NULL,PRIMARY KEY(child_nid,nid))');
  var data = JSON.parse(window.localStorage.getItem('albums'));
  $.each(data, function(key, value) {
    if(key != 'albumcount') {
      value.body = escape(value.body);
      value.title = escape(value.title);
      tx.executeSql('INSERT OR REPLACE INTO ALBUMS VALUES ("'+value.nid+'","'+value.title+'","'+value.body+'","'+value.posted_on+'","'+value.timestamp+'","'+value.like+'","'+value.likescount+'","'+value.cover_thumbnail+'","'+value.child_nid+'")');
    }
  });
}

function updateDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(handleUpdate,errorfn,successdb);
}

function handleUpdate(tx) {
  tx.executeSql('SELECT * FROM ALBUMS', [], printRecords, errorfn);
}

function printRecords(tx, results) {
  if(results.rows.length > 0) {
    var data = JSON.parse(window.localStorage.getItem('albums'));
    $.each(data, function(key, value) {
      if(key != 'count') {
        tx.executeSql('DELETE FROM ALBUMS WHERE nid ='+value+' AND child_nid ='+child_nid+'');
        tx.executeSql('DELETE FROM PHOTO WHERE album_nid ='+value+' AND child_nid ='+child_nid+'');
      }
    });
  }
}

function setmaxAlbumTimestamp(tx,results) {
  if(results.rows.length > 0) {
    $.each(results.rows.item(0),function(k,v) {
      window.localStorage.setItem('album_timestamp','v');
    });
  }
}

function albumsRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    window.localStorage.setItem('album_prev_back_pos',0);
    if(window.localStorage.getItem('album_index_'+child_nid) == null) {
      window.localStorage.setItem('album_index_'+child_nid,0);
    }
    var album_index = window.localStorage.getItem('album_index_'+child_nid);
    var album_timestamp = window.localStorage.getItem('album_timestamp_'+child_nid);
    if(eventType == 'refresh') {
      var data = {timestamp : album_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
      window.localStorage.setItem('album_refresh_'+child_nid,'no');
    }
    else if(eventType == 'swipe') {
      var data = {index : album_index,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    }
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url + '/coolgmapp/mm_albums/'+ uid + '/' +child_nid,
      data: data,
      contentType: "application/json",
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        if(data.albumcount == 0 && eventType == 'swipe') {
          window.localStorage.setItem('albums_full_fetch_'+child_nid,'YES');
        }
        storeAlbums(data);
        album_index = Number(window.localStorage.getItem('album_index_'+child_nid)) + Number(data.albumcount);
        window.localStorage.setItem('album_index_'+child_nid,album_index);
        createDB();
        mmalbumsOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Albums");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none' && eventType == 'click') {
    coolgalert('No Network Connection');
    return false;
  }
}

function albumsDelete(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var album_nids = window.localStorage.getItem('album_nids_'+child_nid);
    var data = {check_nodes : album_nids,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/delete/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        storeAlbums(data);
        album_index = Number(window.localStorage.getItem('album_index_'+child_nid)) - Number(data.count);
        window.localStorage.setItem('album_index_'+child_nid,album_index);
        updateDB();
        mmalbumsOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Albums");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
  }
}

$(window).scroll(function() {
  var scroll = $(window).scrollTop() - ($(document).height() - $(window).height());
  if(scroll >= -10 && scroll <= 10) {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      if(window.localStorage.getItem('albums_full_fetch_'+child_nid) == null) {
        //Fetch only if albums are present.
        albumsRetrieve('swipe');
      }
    }
  }
});
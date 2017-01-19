var url = window.location.href;
var params = url.split("?")[1];
var child_nid = url.split("&")[0];
child_nid = child_nid.split("=")[1];
var album_nid = url.split("&")[1];
album_nid = album_nid.split("=")[1];
var uid='';

document.addEventListener("deviceready", mmphotosOnload, false);

function mmphotosOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", mmphotosBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(getPhotos,errorfn,successfn); 
}

function mmphotosBackbutton() {
  navigator.app.backHistory();
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

function getPhotos(tx) {
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('CREATE TABLE IF NOT EXISTS PHOTO(album_nid INT NOT NULL,child_nid INT NOT NULL,fid INT NOT NULL,uri,photo_index,title,PRIMARY KEY(album_nid,child_nid,fid))');
  tx.executeSql('SELECT * FROM PHOTO WHERE album_nid=? and child_nid=?',[album_nid,child_nid],showPhotos,errorfn);
}

function getuidSuccess(tx,results) {
  uid = results.rows.item(0).uid;
}

function showPhotos(tx,results) {
  if(results.rows.length > 0) {
    $.mobile.loading('show');
    var output = '';
    var title = '';
    for(var i=0; i<results.rows.length; i++) {
      title = unescape(results.rows.item(i).title);
      if(title.length > 40) {
        title = title.substr(0,40) + '...';
      }
      output += '<div id="photos"><img src="'+results.rows.item(i).uri+'" data-plugin-slide-caption="'+results.rows.item(i).photo_index+'"></div>';   
    }
    $("#slider").html(output);    
    $.mobile.loading('hide');
    $("#slider").excoloSlider();
    $("b.label").html(title);
    $("#slider .es-pager").hide();
    if(results.rows.length > 1 && results.rows.length <= 25) {
      $("#slider .es-pager").show();
    }
  }
  else {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      photosRetrieve();
    }
  }
}

function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successfn);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS PHOTO(album_nid INT NOT NULL,child_nid INT NOT NULL,fid INT NOT NULL,uri,photo_index,title,PRIMARY KEY(album_nid,child_nid,fid))');
  var data = JSON.parse(window.localStorage.getItem('photos_'+album_nid+'_'+child_nid));
  $.each(data, function(key, value) {
    if(key == album_nid) {
      var k = 1;
      $.each(value, function(pkey, pvalue) {
        if(value.photoscount >= k) {
          if(pkey != 'photoscount') {
            pvalue.title = escape(pvalue.title);
            tx.executeSql('INSERT OR IGNORE INTO PHOTO(album_nid,child_nid,fid,uri,photo_index,title) VALUES ("'+album_nid+'","'+child_nid+'","'+pvalue.fid+'","'+pvalue.uri+'","'+k+'/'+value.photoscount+'","'+pvalue.title+'")');
            k++;
          }
        }
      });
    }
  });
}

function successfn() {
  console.log('Printed MM photos success Successfully');
}

function errorfn(err) {
  console.log('Error in MM photos' + err.code);
}

function storePhotos(data) {
  var storage = window.localStorage;
  storage.setItem('photos_'+album_nid+'_'+child_nid,JSON.stringify(data));
}

function photosRetrieve() {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url + '/coolgmapp/mm_photos/' + uid + '/' +child_nid + '/' + album_nid,
      data: {username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')},
      contentType: "application/json",
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        if(data != '') {
          storePhotos(data);
          createDB();
          mmphotosOnload();
        }
      },
      error:function(error,textStatus,errorThrown) {
        console.log(errorThrown);
      }
    });
  }
}
var url = window.location.href;
var memoir_nid = url.split("?")[1];
memoir_nid = url.split("=")[1];
var uid='';

document.addEventListener("deviceready", memoirentryOnload, false);

function memoirentryOnload() {
  document.addEventListener("backbutton", memoirentryBackbutton, false);
  $('#memoir_comment').hide();
  $("#single_memoir_entry_comment_area").hide();
  setTimeout(checkConnection(),10000);
  var db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(showMemoir,errorfn,successfn);
}

function memoirentryBackbutton() {
  navigator.app.backHistory()
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

function showMemoir(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS MEMOIR(nid PRIMARY KEY,title,body,posted_on)');
  tx.executeSql("SELECT * FROM MEMOIR WHERE nid='" +memoir_nid+ "'" ,[],showMemoirSuccess,errorfn);
  tx.executeSql("SELECT uid FROM USER",[],getuidSuccess,uiderrorfn);
  tx.executeSql('CREATE TABLE IF NOT EXISTS COMMENT(cid INT NOT NULL,nid INT NOT NULL,body,author,posted_on,image,timestamp,PRIMARY KEY(cid,nid))');
  tx.executeSql("SELECT * FROM COMMENT WHERE nid='" +memoir_nid+ "' ORDER BY timestamp" ,[],showMemoirCommentSuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM COMMENT WHERE nid="' +memoir_nid+ '"',[],getMaxTimestamp,errorfn);
}

function showMemoirSuccess(tx,results) {
  if(results.rows.length > 0) {
    var output = '';
    $.mobile.loading('show');
    for(var i=0; i<results.rows.length; i++) {
      output += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
      output += '<div class="title">'+unescape(results.rows.item(i).title)+'</div>';
      output += '<div class="body">'+unescape(results.rows.item(i).body)+'</div>';
    }
    $("#single_memoir_entry").html(output);
    var user_loggedin = window.localStorage.getItem('user_loggedin');
    if(user_loggedin == 1) {
      $('#memoir_comment').show();
    }
    $.mobile.loading('hide');
  }
  else {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      memoirRetrieve();
    }
  }
}

function showMemoirCommentSuccess(tx,results) {
  if(results.rows.length > 0) {
    var commentoutput = '';
    $("#single_memoir_entry_comment_area").show();
    $.mobile.loading('show');
    for(var i=0; i<results.rows.length; i++) {
      commentoutput += '<BR><div class="photo"><img src="'+results.rows.item(i).image+'"/>';
      commentoutput += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
      commentoutput += '<div class="body"><b>'+results.rows.item(i).author+'</b>:&nbsp;&nbsp;'+unescape(results.rows.item(i).body)+'</div><BR>';
    }
    $("#single_memoir_entry_comment_area").html(commentoutput);
    $.mobile.loading('hide');
  }
}

function getMaxTimestamp(tx,results) {
  $.each(results.rows.item(0), function(key,value){
    window.localStorage.setItem('comment_timestamp_'+memoir_nid,value);
  });
}

function successfn() {
  console.log('Retreival success');
}

function createDB() {
  var db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS MEMOIR(nid PRIMARY KEY,title,body,posted_on)');
  tx.executeSql('CREATE TABLE IF NOT EXISTS COMMENT(cid INT NOT NULL,nid INT NOT NULL,body,author,posted_on,image,timestamp,PRIMARY KEY(cid,nid))');
  var data = JSON.parse(window.localStorage.getItem('memoir_'+memoir_nid));
  $.each(data, function(key, value) {
    var mem_body = escape(value.body);
    value.title = escape(value.title);
    tx.executeSql('INSERT OR IGNORE INTO MEMOIR(nid,title,body,posted_on) VALUES ("'+value.nid+'","'+value.title+'","'+mem_body+'","'+value.posted_on+'")');
    if(!(jQuery.isEmptyObject(value.comments))) {
      $.each(value.comments, function(ckey, cvalue) {
        var comm_body = escape(cvalue.body);
        tx.executeSql('INSERT OR IGNORE INTO COMMENT(cid,nid,body,author,posted_on,image,timestamp) VALUES ("'+ckey+'","'+value.nid+'","'+comm_body+'","'+cvalue.author+'","'+cvalue.posted_on+'","'+cvalue.image+'","'+cvalue.timestamp+'")');
      });
    }
  });
}

function errorfn(err) {
  console.log("Error processing SQL:" + err.code);
}

function uiderrorfn(err) {
  console.log("Error processing User SQL:" + err.code);
}

function successdb() {
  console.log("Database has been created successfully");
}

function getuidSuccess(tx,results) {
  uid = results.rows.item(0).uid;
}

function storeMemoir(data) {
  var storage = window.localStorage;
  storage.setItem('memoir_'+memoir_nid,JSON.stringify(data));
}

function memoirRetrieve() {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_coolg_site_url + '/coolgmapp/memoir/' + memoir_nid,
      data: {token:'coolgurukul_mapp'},
      contentType: "application/json",
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        storeMemoir(data);
        createDB();
        memoirentryOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Memoir");
        console.log(errorThrown);
      }
    });
  }
}

function postMemoirComment() {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var comment_body =  $('#memoir_comment .body').val();
    if(comment_body == '') {
      coolgalert('Please Enter the Comment');
      $('#memoir_comment .body').focus();
      return false;
    }
    $.ajax({
      type: 'POST',
      url: coolgmapp_settings_coolg_site_url + '/coolgmapp/postcomment',
      crossDomain: true,
      beforeSend : function() { $('#memoir_comment .body').val(''); coolgalert('Posting Comment'); },
      data       : {nid : memoir_nid, uid : uid, comment_body : comment_body, username: window.localStorage.getItem('user_name'), password: window.localStorage.getItem('user_password')},
      contentType: "application/json",
      dataType: 'jsonp',
      success:function(data) {
        if(data == 1) {
          coolgalert('Your Comment has been Posted');
          $('#memoir_comment .body').val('');
          memoirRetrieve();
        }
        else if(data == 0) {
          coolgalert('Unable to Post Comment');
        }
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert('Unable to Post Comment');
        console.log(errorThrown);
      }
    });
  }
  else {
    coolgalert('No Network Connection');
    return false;
  }
}
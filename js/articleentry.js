var url = window.location.href;
var article_nid = url.split("?")[1];
article_nid = url.split("=")[1];
var uid='';

document.addEventListener("deviceready", articleentryOnload, false);

function articleentryOnload() {
  document.addEventListener("backbutton", articleentryBackbutton, false);
  $('#article_comment').hide();
  setTimeout(checkConnection(),10000);
  $("#single_article_entry_comment_area").hide();
  var db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(showArticle,errorfn,successfn);
}

function articleentryBackbutton() {
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

function showArticle(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS ARTICLE(nid PRIMARY KEY,title,body,posted_on)');
  tx.executeSql("SELECT * FROM ARTICLE WHERE nid='" +article_nid+ "'" ,[],showArticleSuccess,errorfn);
  tx.executeSql("SELECT uid FROM USER",[],getuidSuccess,uiderrorfn);
  tx.executeSql('CREATE TABLE IF NOT EXISTS COMMENT(cid INT NOT NULL,nid INT NOT NULL,body,author,posted_on,image,timestamp,PRIMARY KEY(cid,nid))');
  tx.executeSql("SELECT * FROM COMMENT WHERE nid='" +article_nid+ "' ORDER BY timestamp" ,[],showArticleCommentSuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM COMMENT WHERE nid="' +article_nid+ '"',[],getMaxTimestamp,errorfn);
}

function showArticleSuccess(tx,results) {
  if(results.rows.length > 0) {
    var output = '';
    $.mobile.loading('show');
    for(var i=0; i<results.rows.length; i++) {
      output += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
      output += '<div class="title">'+results.rows.item(i).title+'</div>';
      output += '<div class="body">'+unescape(results.rows.item(i).body)+'</div>';
    }
    $("#single_article_entry").html(output);
    var user_loggedin = window.localStorage.getItem('user_loggedin');
    if(user_loggedin == 1) {
      $('#article_comment').show();
    }
    $.mobile.loading('hide');
  }
  else {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      articleRetrieve();
    }
  }
}

function showArticleCommentSuccess(tx,results) {
  if(results.rows.length > 0) {
    $("#single_article_entry_comment_area").show();
    var commentoutput = '';
    $.mobile.loading('show');
    for(var i=0; i<results.rows.length; i++) {
      commentoutput += '<BR><div class="photo"><img src="'+results.rows.item(i).image+'"/>';
      commentoutput += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
      commentoutput += '<div class="body"><b>'+results.rows.item(i).author+'</b>:&nbsp;&nbsp;'+unescape(results.rows.item(i).body)+'</div><BR>';
    }
    $("#single_article_entry_comment_area").html(commentoutput);
    $.mobile.loading('hide');
  }
}

function getMaxTimestamp(tx,results) {
  $.each(results.rows.item(0), function(key,value){
    window.localStorage.setItem('comment_timestamp_'+article_nid,value);
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
  tx.executeSql('CREATE TABLE IF NOT EXISTS ARTICLE(nid PRIMARY KEY,title,body,posted_on)');
  tx.executeSql('CREATE TABLE IF NOT EXISTS COMMENT(cid INT NOT NULL,nid INT NOT NULL,body,author,posted_on,image,timestamp,PRIMARY KEY(cid,nid))');
  var data = JSON.parse(window.localStorage.getItem('article_'+article_nid));
  $.each(data, function(key, value) {
    var article_body = escape(value.body);
    tx.executeSql('INSERT OR IGNORE INTO ARTICLE(nid,title,body,posted_on) VALUES ("'+value.nid+'","'+value.title+'","'+article_body+'","'+value.posted_on+'")');
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
  $('#article_comment').hide();
}

function successdb() {
  console.log("Database has been created successfully");
}

function getuidSuccess(tx,results) {
  uid = results.rows.item(0).uid;
}

function storeArticle(data) {
  var storage = window.localStorage;
  storage.setItem('article_'+article_nid,JSON.stringify(data));
}

function articleRetrieve() {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_coolg_site_url + '/coolgmapp/article/' + article_nid,
      data: {token:'coolgurukul_mapp'},
      contentType: "application/json",
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        storeArticle(data);
        createDB();
        articleentryOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Article");
        console.log(errorThrown);
      }
    });
  }
}

function postArticleComment() {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var comment_body =  $('#article_comment .body').val();
    if(comment_body == '') {
      coolgalert('Please Enter the Comment');
      $('#article_comment .body').focus();
      return false;
    }
    $.ajax({
      type: 'POST',
      url: coolgmapp_settings_coolg_site_url + '/coolgmapp/postcomment',
      crossDomain: true,
      beforeSend : function() { $('#article_comment .body').val(''); coolgalert('Posting Comment'); },
      data       : {nid : article_nid, uid : uid, comment_body : comment_body, username: window.localStorage.getItem('user_name'), password: window.localStorage.getItem('user_password')},
      contentType: "application/json",
      dataType: 'jsonp',
      success:function(data) {
        if(data == 1) {
          coolgalert('Your Comment has been Posted');
          articleRetrieve();
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
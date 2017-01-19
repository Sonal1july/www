var url = window.location.href;
var params = url.split("?")[1];
var child_nid = url.split("&")[0];
child_nid = child_nid.split("=")[1];
var drs_nid = url.split("&")[1];
drs_nid = drs_nid.split("=")[1];
var uid='';

document.addEventListener("deviceready", drsentryOnload, false);

function drsentryOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", drsentryBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printDrsSinglePage,errorfn,successfn);
}

function drsentryBackbutton() {
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

function printDrsSinglePage(tx) {
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM DRS WHERE child_nid=? and drs_nid=?',[child_nid,drs_nid],printDrsSinglePageSuccess,errorfn);
  tx.executeSql('CREATE TABLE IF NOT EXISTS PARENTCOMMENT(diary_nid INT NOT NULL,cid INT NOT NULL,child_nid INT NOT NULL,body,posted_on,timestamp,author,PRIMARY KEY(diary_nid,cid,child_nid))');
  tx.executeSql('SELECT * FROM PARENTCOMMENT WHERE diary_nid="' +drs_nid+ '"' ,[],showDiaryCommentSuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM PARENTCOMMENT WHERE child_nid=? and diary_nid=?',[child_nid,drs_nid],getMaxTimestamp,errorfn);
}

function getuidSuccess(tx,results) {
  uid = results.rows.item(0).uid ;
}

function printDrsSinglePageSuccess(tx,result) {
  var len = result.rows.length;
    if(len > 0) {
      var record = result.rows.item(0);
      var drsResult = '';
      drsResult += '<div class="title">'+record['drs_title'] +'</div>';
      if(record['drs_body'] != "null") {
        body = unescape(record['drs_body']);
        drsResult +='<div class="body">'+body+'</div>';
      }
    }
  $("#single_drs_entry").html(drsResult);
}

function successfn() {
  console.log('Printed Diary Entry Successfully');
}

function errorfn(err) {
  console.log('Error in Printing Diary Entry' + err.code);
}

function showDiaryCommentSuccess(tx,results) {
  if(results.rows.length > 0) {
    setTimeout(function () {commentsRetrieve(); }, 4000);
      var commentoutput = '<b class="label">Comments:</b>';
      $.mobile.loading('show');
      for(var i=0; i<results.rows.length; i++) {
        commentoutput += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
        commentoutput += '<div class="body"><b>'+results.rows.item(i).author+'</b>:&nbsp;&nbsp;'+results.rows.item(i).body+'</div><BR>';
      }
      $("#single_drs_entry_comment_area").html(commentoutput);
      $.mobile.loading('hide');
  }
  else {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      commentsRetrieve();
    }
  }
}

function getMaxTimestamp(tx,results) {
  $.each(results.rows.item(0), function(key,value){
    window.localStorage.setItem('drs_comment_timestamp_'+child_nid,value);
  });
}

function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successfn);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS PARENTCOMMENT(diary_nid INT NOT NULL,cid INT NOT NULL,child_nid INT NOT NULL,body,posted_on,timestamp,author,PRIMARY KEY(diary_nid,cid,child_nid))');
  var data = JSON.parse(window.localStorage.getItem('comment_' +drs_nid));
  $.each(data, function(ckey, cvalue) {
    if(cvalue.nid == drs_nid) {
      tx.executeSql('INSERT OR IGNORE INTO PARENTCOMMENT(diary_nid,cid,child_nid,body,posted_on,timestamp,author) VALUES ("'+cvalue.nid+'","'+cvalue.cid+'","'+child_nid+'","'+cvalue.body+'","'+cvalue.posted_on+'","'+cvalue.timestamp+'","'+cvalue.author+'")');
    }
  });
}

function successfn() {
  console.log('Printed Drs Entry Successfully');
}

function errorfn(err) {
  console.log('Error in Printing Drs Entry' + err.code);
}

function storeComment(data) {
  var storage = window.localStorage;
  storage.setItem('comment_'+drs_nid,JSON.stringify(data));
}

function commentsRetrieve() {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var comment_timestamp = window.localStorage.getItem('drs_comment_timestamp_'+child_nid);
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url + '/coolgmapp/getcomment/' + uid + '/' +child_nid + '/' + drs_nid,
      data: {timestamp: comment_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')},
      contentType: "application/json",
      dataType: 'jsonp',
      crossDomain: true,
      success:function(data) {
        if(data != '') {
          storeComment(data);
          createDB();
          drsentryOnload();
        }
      },
      error:function(error,textStatus,errorThrown) {
        console.log(errorThrown);
      }
    });
  }
}

function postDrsComment() {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    if($('#diary_comment .body').val()) {
      var comment_body =  $('#diary_comment .body').val();
    }
    else {
      coolgalert('Please Enter the Comment');
      $('#diary_comment .body').focus();
      return false;
    }
    $.ajax({
      type: 'POST',
      url: coolgmapp_settings_app_site_url + '/coolgmapp/postcomment/'+ uid + '/' + child_nid,
      crossDomain: true,
      beforeSend : function() {$('#diary_comment .body').val('');coolgalert('Posting Comment');},
      data       : {nid : drs_nid, comment_body : comment_body, username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')},
      contentType: "application/json",
      dataType: 'jsonp',
      success:function(data) {
        if(data == 'TRUE') {
          coolgalert('Your Comment has been Posted');
          commentsRetrieve();
        }
        else if(data == 'FALSE') {
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
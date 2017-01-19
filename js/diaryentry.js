var url = window.location.href;
var params = url.split("?")[1];
var child_nid = url.split("&")[0];
child_nid = child_nid.split("=")[1];
var diary_nid = url.split("&")[1];
diary_nid = diary_nid.split("=")[1];
var uid='';

document.addEventListener("deviceready", diaryentryOnload, false);

function diaryentryOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", diaryentryBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printDiarySinglePage,errorfn,successfn);
}

function diaryentryBackbutton() {
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

function printDiarySinglePage(tx) {
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM DIARY WHERE child_nid=? and diary_nid=?',[child_nid,diary_nid],printDiarySinglePageSuccess,errorfn);
  tx.executeSql('CREATE TABLE IF NOT EXISTS PARENTCOMMENT(diary_nid INT NOT NULL,cid INT NOT NULL,child_nid INT NOT NULL,body,posted_on,timestamp,author,PRIMARY KEY(diary_nid,cid,child_nid))');
  tx.executeSql('SELECT * FROM PARENTCOMMENT WHERE diary_nid="' +diary_nid+ '"' ,[],showDiaryCommentSuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM PARENTCOMMENT WHERE child_nid=? and diary_nid=?',[child_nid,diary_nid],getMaxTimestamp,errorfn);
}

function getuidSuccess(tx,results) {
  uid = results.rows.item(0).uid ;
}

function printDiarySinglePageSuccess(tx,result) {
  var len = result.rows.length;
    if(len > 0) {
      var record = result.rows.item(0);
      var diaryResult = '<div class="posted_on">'+record['posted_on'] +'</div>';
      diaryResult += '<div class="title">'+ unescape(record['diary_title']) +'</div>';
      if(record['diary_body'] != "null") {
        body = unescape(record['diary_body']);
        diaryResult +='<BR><b>Description:</b><div class="body">'+body+'</div>';
      }
      if(record['due_date'] != "NULL") {
        diaryResult +='<BR><b>Due Date:</b><div class="duedate message">'+record['due_date']+'</div>';
      }
      if(record['attachment_type'] != "NULL" && record['attachment_type'] == "image") {
        diaryResult += '<BR><div class="image"><img src="'+record['attachment']+'"/></div>';
      }
      if(record['attachment_type'] != "NULL" && record['attachment_type'] == "file") {
        diaryResult += '<BR><div class="attachment"><a href="'+record['attachment']+'" title="View Attachment"><img src="images/attachment.png"/>Download Attachment</a></div>';
      }
      if(record['response'] == 1) {
        $('#single_diary_entry_comment_area').hide();
        var current_date = new Date();
        //show response Options only if due date is greater than current date
        if(new Date(record['due_date']) > current_date) {
          $('#diary_response').show();
          var response_options =  record['response_options'].split(',');
          var options = '';
          for(var i=0;i<response_options.length;i++ ) {
            options +=  '<option>' + response_options[i] + '</option>' ;
          }
          $('#select_response_options').html(options).selectmenu('refresh', true);
        }
      }
      else {
        $('#diary_comment').show();
      }
    }
  $("#single_diary_entry").html(diaryResult);
}

function showDiaryCommentSuccess(tx,results) {
  if(results.rows.length > 0) {
    setTimeout(function () {commentsRetrieve();}, 4000);
    $("#single_diary_entry_comment_area").show();
      var commentoutput = '<b class="label">Comments:</b>';
      $.mobile.loading('show');
      for(var i=0; i<results.rows.length; i++) {
        commentoutput += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
        commentoutput += '<div class="body"><b>'+results.rows.item(i).author+'</b>:&nbsp;&nbsp;'+results.rows.item(i).body+'</div><BR>';
      }
      $("#single_diary_entry_comment_area").html(commentoutput);
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
    window.localStorage.setItem('comment_timestamp_'+child_nid,value);
  });
}

function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successfn);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS PARENTCOMMENT(diary_nid INT NOT NULL,cid INT NOT NULL,child_nid INT NOT NULL,body,posted_on,timestamp,author,PRIMARY KEY(diary_nid,cid,child_nid))');
  var data = JSON.parse(window.localStorage.getItem('comment_' +diary_nid));
  $.each(data, function(ckey, cvalue) {
    if(cvalue.nid == diary_nid) {
      tx.executeSql('INSERT OR IGNORE INTO PARENTCOMMENT(diary_nid,cid,child_nid,body,posted_on,timestamp,author) VALUES ("'+cvalue.nid+'","'+cvalue.cid+'","'+child_nid+'","'+cvalue.body+'","'+cvalue.posted_on+'","'+cvalue.timestamp+'","'+cvalue.author+'")');
    }
  });
}

function successfn() {
  console.log('Printed Diary Entry Successfully');
}

function errorfn(err) {
  console.log('Error in Printing Diary Entry' + err.code);
}

function storeComment(data) {
  var storage = window.localStorage;
  storage.setItem('comment_'+diary_nid,JSON.stringify(data));
}

function commentsRetrieve() {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var comment_timestamp = window.localStorage.getItem('comment_timestamp_'+child_nid);
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url + '/coolgmapp/getcomment/' + uid + '/' +child_nid + '/' + diary_nid,
      data: {timestamp: comment_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')},
      contentType: "application/json",
      dataType: 'jsonp',
      crossDomain: true,
      success:function(data) {
        if(data != '') {
          storeComment(data);
          createDB();
          diaryentryOnload();
        }
      },
      error:function(error,textStatus,errorThrown) {
        console.log(errorThrown);
      }
    });
  }
}

function postDiaryComment() {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    if($('#diary_comment .body').val()) {
      var comment_body =  $('#diary_comment .body').val();
    }
    else if($('#select_response_options').val()) {
      var comment_body = $('#select_response_options').val();
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
      data       : {nid : diary_nid, comment_body : comment_body, username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')},
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
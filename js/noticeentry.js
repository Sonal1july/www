var url = window.location.href;
var params = url.split("?")[1];
var child_nid = url.split("&")[0];
child_nid = child_nid.split("=")[1];
var nid = url.split("&")[1];
nid = nid.split("=")[1];

document.addEventListener("deviceready", noticeentryOnload, false);

function noticeentryOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", noticeentryBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printNoticeSinglePage,errorfn,successfn);
}

function noticeentryBackbutton() {
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

function printNoticeSinglePage(tx) {
  tx.executeSql('SELECT * FROM NOTICE WHERE child_nid=? and nid=?',[child_nid,nid],printNoticeSinglePageSuccess,errorfn);
}

function printNoticeSinglePageSuccess(tx,result) {
  var len = result.rows.length;
  if(len > 0) {
    var record = result.rows.item(0);
    var noticeResult = '<div class="posted_on">'+record['posted_on'] +'</div>';
    noticeResult += '<div class="title">'+record['title'] +'</div>';
    if(record['body'] != "NULL") {
      body = unescape(record['body']);
      noticeResult +='<BR><b>Description:</b><div class="body">'+body+'</div>';
    }
    if(record['attachment_type'] != "NULL" && record['attachment_type'] == "image") {
      noticeResult += '<BR><div class="image"><img src="'+record['attachment']+'"/></div>';
    }
    if(record['attachment_type'] != "NULL" && record['attachment_type'] == "file") {
      noticeResult += '<BR><div class="attachment"><a href="'+record['attachment']+'" title="View Attachment"><img src="images/attachment.png"/>Download Attachment</a></div>';
    }
  }
  $("#single_notice_entry").html(noticeResult);
}

function successfn() {
  console.log('Printed Notice Entry Successfully');
}

function errorfn(err) {
  console.log('Error in Printing Notice Entry' + err.code);
}
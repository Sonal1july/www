var url = window.location.href;
var params = url.split("?")[1];
var child_nid = url.split("&")[0];
child_nid = child_nid.split("=")[1];
var nl_nid = url.split("&")[1];
nl_nid = nl_nid.split("=")[1];

document.addEventListener("deviceready", nlentryOnload, false);

function nlentryOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", nlentryBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printNlSinglePage,errorfn,successfn);
}

function nlentryBackbutton() {
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

function printNlSinglePage(tx) {
  tx.executeSql('SELECT * FROM NEWSLETTER WHERE child_nid=? and nl_nid=?',[child_nid,nl_nid],printNlSinglePageSuccess,errorfn);
}

function printNlSinglePageSuccess(tx,result) {
  var len = result.rows.length;
  if(len > 0) {
    var record = result.rows.item(0);
    var nlResult = '<div class="posted_on">'+record['posted_on'] +'</div>';
    nlResult += '<div class="title">'+record['title'] +'</div>';
    if(record['body'] != "NULL") {
      nlResult +='<BR><div class="body">'+unescape(record['body'])+'</div>';
    }
    if(record['attachment_type'] != "NULL" && record['attachment_type'] == "image") {
      nlResult += '<BR><div class="image"><img src="'+record['attachment']+'"/></div>';
    }
    if(record['attachment_type'] != "NULL" && record['attachment_type'] == "file") {
      nlResult += '<BR><div class="attachment"><a href="'+record['attachment']+'" title="View Attachment"><img src="images/attachment.png"/>Download Attachment</a></div>';
    }
  }
  $("#single_nl_entry").html(nlResult);
}

function successfn() {
  console.log('Printed Newsletter Successfully');
}

function errorfn(err) {
  console.log('Error in Printing Newsletter' + err.code);
}
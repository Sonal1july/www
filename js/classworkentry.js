var url = window.location.href;
var params = url.split("?")[1];
var child_nid = url.split("&")[0];
child_nid = child_nid.split("=")[1];
var cw_nid = url.split("&")[1];
cw_nid = cw_nid.split("=")[1];

document.addEventListener("deviceready", classworkentryOnload, false);

function classworkentryOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", classworkentryBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printClassworkSinglePage,errorfn,successfn);
}

function classworkentryBackbutton() {
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

function printClassworkSinglePage(tx) {
  tx.executeSql('SELECT * FROM CLASSWORK WHERE child_nid=? and cw_nid=?',[child_nid,cw_nid],printClassworkSinglePageSuccess,errorfn);
}

function printClassworkSinglePageSuccess(tx,result) {
  var len = result.rows.length;
  if(len > 0) {
    var record = result.rows.item(0);
    var cwResult = '<div class="posted_on">'+record['posted_on'] +'</div>';
    cwResult += '<div class="title">'+unescape(record['title'])+'</div>';
    if(record['subject'] != "null") {
    cwResult += '<BR><b>Subject:</b><div class="subject message">'+record['subject'] +'</div>';
    }
    if(record['body'] != "NULL") {
      cwResult +='<BR><b>Description:</b><div class="body">'+unescape(record['body'])+'</div>';
    }
    if(record['details'] != "NULL") {
      cwResult +='<BR><b>Assignment Details:</b><div class="details message">'+unescape(record['details'])+'</div>';
    }
    if(record['submission'] != "NULL") {
      cwResult +='<BR><b>Submission Date:</b><div class="duedate message">'+record['submission']+'</div>';
    }
    if(record['attachment_type'] != "NULL" && record['attachment_type'] == "image") {
      cwResult += '<BR><div class="image"><img src="'+record['attachment']+'"/></div>';
    }
    if(record['attachment_type'] != "NULL" && record['attachment_type'] == "file") {
      cwResult += '<BR><div class="attachment"><a href="'+record['attachment']+'" title="View Attachment"><img src="images/attachment.png"/>Download Attachment</a></div>';
    }
  }
  $("#single_classwork_entry").html(cwResult);
}

function successfn() {
  console.log('Printed Classwork Entry Successfully');
}

function errorfn(err) {
  console.log('Error in Printing Classwork Entry' + err.code);
}
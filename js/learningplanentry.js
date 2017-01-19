var url = window.location.href;
var params = url.split("?")[1];
var child_nid = url.split("&")[0];
child_nid = child_nid.split("=")[1];
var lp_id = url.split("&")[1];
lp_id = lp_id.split("=")[1];

document.addEventListener("deviceready", lpentryOnload, false);

function lpentryOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", learningplanBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printLpSinglePage,errorfn,successfn);
}

function learningplanBackbutton() {
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

function printLpSinglePage(tx) {
  var args = lp_id.split("_");
  tx.executeSql('SELECT * FROM LEARNINGPLAN WHERE child_nid=? and nid=? and lp_define_value=?',[child_nid,args[0],args[1]],printLpSinglePageSuccess,errorfn);
}

function printLpSinglePageSuccess(tx,result) {
  var len = result.rows.length;
  if(len > 0) {
    var record = result.rows.item(0);
    var lpResult = '<div class="posted_on">'+record['posted_on'] +'</div>';
    lpResult += '<div class="title">'+record['lp_title'] +'</div>';
    lpResult += '<BR><b>Topic:</b><div class="subject message">'+unescape(record['topic_title']) +'</div>';
    if(record['topic_body'] != "NULL") {
      lpResult +='<BR><b>Description:</b><div class="body">'+unescape(record['topic_body'])+'</div>';
    }
    if(record['attachment_type'] != "NULL" && record['attachment_type'] == "image") {
      lpResult += '<BR><div class="image"><img src="'+record['attachment']+'"/></div>';
    }
    if(record['attachment_type'] != "NULL" && record['attachment_type'] == "file") {
      lpResult += '<BR><div class="attachment"><a href="'+record['attachment']+'" title="View Attachment"><img src="images/attachment.png"/>Download Attachment</a></div>';
    }
  }
  $("#single_lp_entry").html(lpResult);
}

function successfn() {
  console.log('Printed Learning plan Entry Successfully');
}

function errorfn(err) {
  console.log('Error in Printing Learning plan Entry' + err.code);
}
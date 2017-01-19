var url = window.location.href;
var params = url.split("?")[1];
var child_nid = url.split("&")[0];
child_nid = child_nid.split("=")[1];
var ft_id = url.split("&")[1];
ft_id = ft_id.split("=")[1];

document.addEventListener("deviceready", ftentryOnload, false);

function ftentryOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", ftentryBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printFtSinglePage,errorfn,successfn);
}

function ftentryBackbutton() {
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

function printFtSinglePage(tx) {
  tx.executeSql('SELECT * FROM FEETRANSACTION WHERE child_nid=? and ft_id=?',[child_nid,ft_id],printFtSinglePageSuccess,errorfn);
}

function printFtSinglePageSuccess(tx,result) {
  var len = result.rows.length;
  if(len > 0) {
    var record = result.rows.item(0);
    var ftResult = '';
    ftResult += '<div class="title">'+record['title'] +'</div>';
    if(record['body'] != "NULL") {
      ftResult +='<BR><div class="body">'+unescape(record['body'])+'</div>';
    }
    if(record['attachment_type'] != "NULL" && record['attachment_type'] == "image") {
      ftResult += '<BR><div class="image"><img src="'+record['attachment']+'"/></div>';
    }
    if(record['attachment_type'] != "NULL" && record['attachment_type'] == "file") {
      ftResult += '<div class="attachment"><a href="'+record['attachment']+'" title="View Attachment"><img src="images/attachment.png"/>Download Fee Receipt</a></div>';
    }
  }
  $("#single_ft_entry").html(ftResult);
}

function successfn() {
  console.log('Printed Fee Transaction Successfully');
}

function errorfn(err) {
  console.log('Error in Printing Fee Transaction' + err.code);
}
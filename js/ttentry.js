var url = window.location.href;
var params = url.split("?")[1];
var child_nid = url.split("&")[0];
child_nid = child_nid.split("=")[1];
var tt_nid = url.split("&")[1];
tt_nid = tt_nid.split("=")[1];

document.addEventListener("deviceready", ttentryOnload, false);

function ttentryOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", ttentryBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printTtSinglePage,errorfn,successfn);
}

function ttentryBackbutton() {
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

function printTtSinglePage(tx) {
  tx.executeSql('SELECT * FROM TIMETABLE WHERE child_nid=? and tt_nid=?',[child_nid,tt_nid],printTtSinglePageSuccess,errorfn);
}

function printTtSinglePageSuccess(tx,result) {
  var len = result.rows.length;
  if(len > 0) {
    var record = result.rows.item(0);
    var ttResult = '<div class="posted_on">'+record['posted_on'] +'</div>';
    ttResult += '<div class="title">'+record['title'] +'</div>';
    if(record['body'] != "NULL") {
      ttResult +='<BR><div class="body">'+unescape(record['body'])+'</div>';
    }
  }
  $("#single_tt_entry").html(ttResult);
}

function successfn() {
  console.log('Printed Time Table Successfully');
}

function errorfn(err) {
  console.log('Error in Printing Time Table' + err.code);
}
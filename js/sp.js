var url = window.location.href;
var child_nid = url.split("?")[1];
child_nid = child_nid.split("&")[0];
child_nid = child_nid.split("=")[1];
var child_name =  url.split("&")[1];
child_name = unescape(child_name.split("=")[1]);
var uid='';

document.addEventListener("deviceready", spOnload, false);

$(document).on('click', '#dashboard_menu li a', function () {
  window.location = $(this).attr('href') +"?child_nid="+child_nid + "&child_name="+child_name;
});

function spOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", spBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printSp,errorfn,successfn);
}

function spBackbutton() {
  window.location = "studentdashboard.html?child_nid="+child_nid+"&child_name="+child_name;
}

function spRefresh() {
  spRetrieve('refresh');
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

function printSp(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS STUDENTPROFILE(child_nid INT NOT NULL,body,timestamp,PRIMARY KEY(child_nid))');
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM STUDENTPROFILE WHERE child_nid="' +child_nid+ '"' ,[],printSpSuccess,errorfn);
}

function printSpSuccess(tx,results) {
  var output ="";
  if(results.rows.length > 0) {
    $.mobile.loading('show');
    tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], sp_getStudentbadge, errorfn);
    for(var i=0; i<results.rows.length; i++) {
      if(results.rows.item(i).body != "NULL") {
    	output = unescape(results.rows.item(i).body);
      }
    }
    $("#sp_data").html(output);
    $.mobile.loading('hide');
  }
  else {
     spRetrieve('refresh');
     tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], sp_getStudentbadge, errorfn);
  }
}

function sp_getStudentbadge(tx,results) {
  if(results.rows.length > 0) {
    var stdbadge = '';
    for(var i=0; i<results.rows.length; i++) {
      stdbadge += '<div class="child">';
      stdbadge += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      stdbadge += '<div class="child_name">'+child_name + "'s Profile"+'</div>';
      stdbadge += '<div class="child_class">'+results.rows.item(i).class+'</div>';
      stdbadge += '<div class="child_schoolname">'+results.rows.item(i).schoolname+'</div>';
      stdbadge += '</div>';
    }
    $('#student_dashboard_badge').show();
    $('#student_dashboard_badge').html(stdbadge);
  }
}

var db = 0;
function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS STUDENTPROFILE(child_nid INT NOT NULL,body,timestamp,PRIMARY KEY(child_nid))');
  var data = JSON.parse(window.localStorage.getItem('spobj'));
  $.each(data, function(key, value) {
    value.body = escape(value.body);
    tx.executeSql('INSERT OR REPLACE INTO STUDENTPROFILE VALUES ("'+child_nid+'","'+value.body+'","'+value.timestamp+'")');
  });
}

function errorfn(err) {
  console.log("Error processing SQL:" + err.code);
}

function getuidSuccess(tx,results) {
  uid = results.rows.item(0).uid ;
}

function successdb() {
  console.log("Database has been created successfully");
}

function successfn() {
  console.log('Retreival success');
}

function storeuserdata(data) {
  var storage = window.localStorage;
  storage.setItem('spobj',JSON.stringify(data));
}

function spRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    if(eventType == 'refresh') {
      var sp_timestamp = Math.round(new Date().getTime()/1000);
      var data = {timestamp : sp_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    }
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/studentprofile/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        storeuserdata(data);
        createDB();
        spOnload();
      },
      error:function(error,textStatus,errorThrown) {
    	coolgalert("Unable to Fetch Student Profile");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none' && eventType == 'refresh') {
    coolgalert('No Network Connection');
    return false;
  }
}
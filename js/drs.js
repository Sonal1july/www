var url = window.location.href;
var child_nid = url.split("?")[1];
child_nid = child_nid.split("&")[0];
child_nid = child_nid.split("=")[1];
var child_name =  url.split("&")[1];
child_name = unescape(child_name.split("=")[1]);
var uid='';
window.localStorage.setItem('drs_refresh_'+child_nid,'yes');

document.addEventListener("deviceready", drsOnload, false);

$(document).on('click', '#dashboard_menu li a', function () {
  window.location = $(this).attr('href') +"?child_nid="+child_nid + "&child_name="+child_name;
});

$(document).on('click', '#drs_list li a', function () {
  window.localStorage.setItem('drs_prev_back_pos',$(this).offset().top);
  window.location = "drsentry.html?child_nid="+child_nid +"&drs_nid=" +$(this).attr('id');
});

function drsOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", drsBackbutton, false);
  setTimeout(checkConnection(),30000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printDrsEntries,errorfn,successfn);
}

function drsBackbutton() {
  window.location = "studentdashboard.html?child_nid="+child_nid+"&child_name="+child_name;
}

function drsRefresh() {
  drsRetrieve('refresh');
  drsDelete();
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

function printDrsEntries(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS DRS(drs_nid INT NOT NULL,drs_title,drs_body,posted_on,timestamp,child_nid INT NOT NULL,PRIMARY KEY(child_nid,drs_nid))');
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM DRS WHERE child_nid="' +child_nid+ '" order by timestamp DESC',[],printDrsSuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM DRS WHERE child_nid="' +child_nid+'"',[],getMaxTimestamp,errorfn);
}

function printDrsSuccess(tx,results) {
  if(results.rows.length > 0) {
    var output = '';
    var drs_nids = '';
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      var drs_refresh = window.localStorage.getItem('drs_refresh_'+child_nid);
      var drs_timestamp = window.localStorage.getItem('drs_timestamp_'+child_nid);
      if(drs_refresh == 'yes' && drs_timestamp != null) {
        drsRetrieve('refresh');
      }
    }
    $.mobile.loading('show');
    tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], drs_getStudentbadge, errorfn);
    for(var i=0; i<results.rows.length; i++) {
      drs_nids += results.rows.item(i).drs_nid +',';
      output += '<li><a id="'+results.rows.item(i).drs_nid +'" href="#">';
      output += '<div class="icon"><img src="images/drs_icon.png"/></div>';
      output += '<div class="title">'+results.rows.item(i).drs_title+'</div>';
      output += '</a></li>';
    }
    window.localStorage.setItem('drs_nids_'+child_nid,drs_nids);
    $("#drs_entries ul").html(output).listview('refresh');
    $.mobile.loading('hide');
    var drs_prev_back_pos = Number(window.localStorage.getItem('drs_prev_back_pos'));
    if(drs_prev_back_pos != 0) {
      drs_prev_back_pos = Number(drs_prev_back_pos) - Number(35);
      $.mobile.silentScroll(drs_prev_back_pos);
    }
  }
  else {
    if(window.localStorage.getItem('drs_full_fetch_'+child_nid) == null) {
      var networkState = navigator.connection.type;
      if(networkState != 'none') {
        drsRetrieve('swipe');
      }
    }
    else if(window.localStorage.getItem('drs_full_fetch_'+child_nid) == 'YES') {
      tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], drs_getStudentbadge, errorfn);
      $("#drs_entries").html("<center><b><span style=color:#C60000;margin-top:20px;>No Entries Found</span></b></center>");
      return false;
    }
  }
}

function drs_getStudentbadge(tx,results) {
  if(results.rows.length > 0) {
    var stdbadge = '';
    for(var i=0; i<results.rows.length; i++) {
      stdbadge += '<div class="child">';
      stdbadge += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      stdbadge += '<div class="child_name">'+child_name + "'s Daily Report"+'</div>';
      stdbadge += '<div class="child_class">'+results.rows.item(i).class+'</div>';
      stdbadge += '<div class="child_schoolname">'+results.rows.item(i).schoolname+'</div>';
      stdbadge += '</div>';
    }
    $('#student_dashboard_badge').show();
    $('#student_dashboard_badge').html(stdbadge);
  }
}

function getMaxTimestamp(tx,results) {
  $.each(results.rows.item(0), function(key,value){
    window.localStorage.setItem('drs_timestamp_'+child_nid,value);
  });
}

function getuidSuccess(tx,results) {
  uid = results.rows.item(0).uid ;
}

function successfn() {
  console.log('Retreival success');
}

function storeuserdata(data) {
  var storage = window.localStorage;
  storage.setItem('drsobj',JSON.stringify(data));
}

var db = 0;
function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS DRS(drs_nid INT NOT NULL,drs_title,drs_body,posted_on,timestamp,child_nid INT NOT NULL,PRIMARY KEY(child_nid,drs_nid))');
  var data = JSON.parse(window.localStorage.getItem('drsobj'));
  $.each(data, function(key, value) {
    if(key != 'drscount' && key != 'foodmenu') {
      value.drs_body = escape(value.drs_body);
      tx.executeSql('INSERT OR REPLACE INTO DRS VALUES ("'+value.drs_nid+'","'+value.drs_title+'","'+value.drs_body+'","'+value.posted_on+'","'+value.timestamp+'","'+value.child_nid+'")');
    }
  });
}

function updateDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(handleUpdate,errorfn,successdb);
}

function handleUpdate(tx) {
  tx.executeSql('SELECT * FROM DRS', [], printRecords, errorfn);
}

function printRecords(tx, results) {
  if(results.rows.length > 0) {
    var data = JSON.parse(window.localStorage.getItem('drsobj'));
    $.each(data, function(key, value) {
      if(key != 'count') {
        tx.executeSql('DELETE FROM DRS WHERE drs_nid ='+value+' AND child_nid ='+child_nid+'');
      }
    });
  }
}

function errorfn(err) {
  console.log("Error processing SQL:" + err.code);
}
function successdb() {
  console.log("Database has been created successfully");
}

function drsRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    window.localStorage.setItem('drs_prev_back_pos',0);
    if(window.localStorage.getItem('drs_index_'+child_nid) == null) {
      window.localStorage.setItem('drs_index_'+child_nid,0);
    }
    var drs_index = window.localStorage.getItem('drs_index_'+child_nid);
    var drs_timestamp = window.localStorage.getItem('drs_timestamp_'+child_nid);
    if(eventType == 'refresh') {
      var data = {timestamp : drs_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
      window.localStorage.setItem('drs_refresh_'+child_nid,'no');
    }
    else if(eventType == 'swipe') {
      var data = {index : drs_index,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    }
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/drs/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        if(data.drscount == 0 && eventType == 'swipe') {
          window.localStorage.setItem('drs_full_fetch_'+child_nid,'YES');
        }
        storeuserdata(data);
        drs_index = Number(window.localStorage.getItem('drs_index_'+child_nid)) + Number(data.drscount);
        window.localStorage.setItem('drs_index_'+child_nid,drs_index);
        createDB();
        drsOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Drs Entries");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none' && eventType == 'refresh') {
    coolgalert('No Network Connection');
    return false;
  }
}

function drsDelete(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var drs_nids = window.localStorage.getItem('drs_nids_'+child_nid);
    var data = {check_nodes : drs_nids,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/delete/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        storeuserdata(data);
        drs_index = Number(window.localStorage.getItem('drs_index_'+child_nid)) - Number(data.count);
        window.localStorage.setItem('drs_index_'+child_nid,drs_index);
        updateDB();
        drsOnload();
      },
      error:function(error,textStatus,errorThrown) {
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
  }
}

$(window).scroll(function() {
  var scroll = $(window).scrollTop() - ($(document).height() - $(window).height());
  if(scroll >= -10 && scroll <= 10) {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      if(window.localStorage.getItem('drs_full_fetch_'+child_nid) == null) {
        //Fetch only if drs entries are present.
        drsRetrieve('swipe');
      }
    }
  }
});
var url = window.location.href;
var child_nid = url.split("?")[1];
child_nid = child_nid.split("&")[0];
child_nid = child_nid.split("=")[1];
var child_name =  url.split("&")[1];
child_name = unescape(child_name.split("=")[1]);
var uid='';
window.localStorage.setItem('tt_refresh_'+child_nid,'yes');

document.addEventListener("deviceready", ttOnload, false);

$(document).on('click', '#dashboard_menu li a', function () {
  window.location = $(this).attr('href') +"?child_nid="+child_nid + "&child_name="+child_name;
});

$(document).on('click', '#tt_list li a', function () {
  window.localStorage.setItem('tt_prev_back_pos',$(this).offset().top);
  window.location = "ttentry.html?child_nid="+child_nid +"&tt_nid=" +$(this).attr('id');
});

$(window).scroll(function() {
  var scroll = $(window).scrollTop() - ($(document).height() - $(window).height());
  if(scroll >= -10 && scroll <= 10) {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      if(window.localStorage.getItem('tt_full_fetch_'+child_nid) == null) {
        //Fetch only if timetable entries are present.
        ttRetrieve('swipe');
      }
    }
  }
});

function ttOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", ttBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printTtEntries,errorfn,successfn);
}

function ttBackbutton() {
  window.location = "studentdashboard.html?child_nid="+child_nid+"&child_name="+child_name;
}

function ttRefresh() {
  ttRetrieve('refresh');
  ttDelete();
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

function printTtEntries(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS TIMETABLE(child_nid INT NOT NULL,tt_nid INT NOT NULL,title,posted_on,body,timestamp,PRIMARY KEY(child_nid,tt_nid))');
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM TIMETABLE WHERE child_nid="' +child_nid+ '" order by timestamp DESC' ,[],printTtSuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM TIMETABLE WHERE child_nid="' +child_nid+'"',[],getMaxTimestamp,errorfn);
}

function printTtSuccess(tx,results) {
  var output ="";
  if(results.rows.length > 0) {
    var tt_nids = '';
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      var tt_refresh = window.localStorage.getItem('tt_refresh_'+child_nid);
      var tt_timestamp = window.localStorage.getItem('tt_timestamp_'+child_nid);
      if(tt_refresh == 'yes' && tt_timestamp != null) {
        ttRetrieve('refresh');
      }
    }
    $.mobile.loading('show');
    tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], tt_getStudentbadge, errorfn);
    for(var i=0; i<results.rows.length; i++) {
      tt_nids += results.rows.item(i).tt_nid +',';
      var ttResult = "";
      ttResult += '<div class="icon"><img src="images/tt_icon.png"/></div>';
      ttResult += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
      if(results.rows.item(i).title.length > 25) {
        var tt_title = results.rows.item(i).title.substr(0,25) + '...';
      }
      else {
        var tt_title = results.rows.item(i).title;
      }
      ttResult += '<div class="title">'+tt_title+'</div>';
      output += '<li><a id="'+results.rows.item(i).tt_nid +'" href="#">'+ttResult+'</a></li>';
    }
    window.localStorage.setItem('tt_nids_'+child_nid,tt_nids);
    $("#tt_entries ul").html(output).listview('refresh');
    $.mobile.loading('hide');
    //Scroll to prev read time table position
    var tt_prev_back_pos = Number(window.localStorage.getItem('tt_prev_back_pos'));
    if(tt_prev_back_pos != 0) {
      tt_prev_back_pos = Number(tt_prev_back_pos) - Number(35);
      $.mobile.silentScroll(tt_prev_back_pos);
    }
  }
  else {
    if(window.localStorage.getItem('tt_full_fetch_'+child_nid) == null) {
      var networkState = navigator.connection.type;
      if(networkState != 'none') {
        ttRetrieve('swipe');
      }
    }
    else if(window.localStorage.getItem('tt_full_fetch_'+child_nid) == 'YES') {
      tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], tt_getStudentbadge, errorfn);
      $("#tt_entries").html("<center><b><span style=color:#C60000;margin-top:20px;>No Entries Found</span></b></center>");
      return false;
    }
  }
}

function tt_getStudentbadge(tx,results) {
  if(results.rows.length > 0) {
    var stdbadge = '';
    for(var i=0; i<results.rows.length; i++) {
      stdbadge += '<div class="child">';
      stdbadge += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      stdbadge += '<div class="child_name">'+child_name + "'s Time Table"+'</div>';
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
    window.localStorage.setItem('tt_timestamp_'+child_nid,value);
  });
}

var db = 0;
function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS TIMETABLE(child_nid INT NOT NULL,tt_nid INT NOT NULL,title,posted_on,body,timestamp,PRIMARY KEY(child_nid,tt_nid))');
  var data = JSON.parse(window.localStorage.getItem('ttobj'));
  $.each(data, function(key, value) {
    if(key != 'tt_count') {
      value.body = escape(value.body);
      tx.executeSql('INSERT OR REPLACE INTO TIMETABLE VALUES ("'+value.child_nid+'","'+value.tt_nid+'","'+value.title+'","'+value.posted_on+'","'+value.body+'","'+value.timestamp+'")');
    }
  });
}

function updateDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(handleUpdate,errorfn,successdb);
}

function handleUpdate(tx) {
  tx.executeSql('SELECT * FROM TIMETABLE', [], printRecords, errorfn);
}

function printRecords(tx, results) {
  if(results.rows.length > 0) {
    var data = JSON.parse(window.localStorage.getItem('ttobj'));
    $.each(data, function(key, value) {
      if(key != 'count') {
        tx.executeSql('DELETE FROM TIMETABLE WHERE tt_nid ='+value+' AND child_nid ='+child_nid+'');
      }
    });
  }
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
  storage.setItem('ttobj',JSON.stringify(data));
}

function ttRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    window.localStorage.setItem('tt_prev_back_pos',0);
    if(window.localStorage.getItem('tt_index_'+child_nid) == null) {
      window.localStorage.setItem('tt_index_'+child_nid,0);
    }
    var tt_index = window.localStorage.getItem('tt_index_'+child_nid);
    var tt_timestamp = window.localStorage.getItem('tt_timestamp_'+child_nid);
    if(eventType == 'refresh') {
      var data = {timestamp : tt_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
      window.localStorage.setItem('tt_refresh_'+child_nid,'no');
    }
    else if(eventType == 'swipe') {
      var data = {index : tt_index,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    }
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/timetable/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        if(data.tt_count == 0 && eventType == 'swipe') {
          window.localStorage.setItem('tt_full_fetch_'+child_nid,'YES');
        }
        storeuserdata(data);
        tt_index = Number(window.localStorage.getItem('tt_index_'+child_nid)) + Number(data.tt_count);
        window.localStorage.setItem('tt_index_'+child_nid,tt_index);
        createDB();
        ttOnload();
      },
      error:function(error,textStatus,errorThrown) {
    	coolgalert("Unable to Fetch Time Table Entries");    	  
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none' && eventType == 'refresh') {
    coolgalert('No Network Connection');
    return false;
  }
}

function ttDelete(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var tt_nids = window.localStorage.getItem('tt_nids_'+child_nid);
    var data = {check_nodes : tt_nids,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
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
        tt_index = Number(window.localStorage.getItem('tt_index_'+child_nid)) - Number(data.count);
        window.localStorage.setItem('tt_index_'+child_nid,tt_index);
        updateDB();
        ttOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Time Table Entries");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
  }
}
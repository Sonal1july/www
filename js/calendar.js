var url = window.location.href;
var child_nid = url.split("?")[1];
child_nid = child_nid.split("&")[0];
child_nid = child_nid.split("=")[1];
var child_name =  url.split("&")[1];
child_name = unescape(child_name.split("=")[1]);
window.localStorage.setItem('calendar_refresh_'+child_nid,'yes');
var uid='';

document.addEventListener("deviceready", calendarOnload, false);

$(document).on('click', '#dashboard_menu li a', function () {
  window.location = $(this).attr('href') +"?child_nid="+child_nid + "&child_name="+child_name;
});

function calendarOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", calendarBackbutton, false);
  checkConnection();
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printCalendarEntries,errorfn,successfn);
}

function calendarBackbutton() {
  window.location = "studentdashboard.html?child_nid="+child_nid+"&child_name="+child_name;
}

function calendarRefresh() {
  calendarRetrieve('refresh');
  calendarDelete();
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

function printCalendarEntries(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS INSTITUTE_EVENTS(event_id INT NOT NULL,title,start_date,description,color_code,end_date,timestamp,child_nid INT NOT NULL,PRIMARY KEY(child_nid,event_id))');
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM INSTITUTE_EVENTS WHERE child_nid="' +child_nid+ '"',[],printCalendarSuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM INSTITUTE_EVENTS WHERE child_nid="' +child_nid+'"',[],getMaxTimestamp,errorfn);
}

function printCalendarSuccess(tx,results) {
  if(results.rows.length > 0) {
    var calendar_nids = '';
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      var calendar_refresh = window.localStorage.getItem('calendar_refresh_'+child_nid);
      var calendar_timestamp = window.localStorage.getItem('calendar_timestamp_'+child_nid);
      if(calendar_refresh == 'yes' && calendar_timestamp != null) {
        calendarRetrieve('refresh');
      }
    }
    var eventData = [];
    for(var i=0; i<results.rows.length; i++) {
      calendar_nids += results.rows.item(i).event_id +',';
      eventData.push({
        "title": unescape(results.rows.item(i).title),
        "start": results.rows.item(i).start_date,
        "description":unescape(results.rows.item(i).description),
        "end":results.rows.item(i).end_date,
        "backgroundColor":results.rows.item(i).color_code,
        "borderColor":results.rows.item(i).color_code
      });
    }
    window.localStorage.setItem('calendar_nids_'+child_nid,calendar_nids);
    $("#event_calendar").html("");
    $("#event_calendar").fullCalendar({
      header: {
        left: ' prev,next',
        center: 'title',
        right: 'today'
      },
      editable: false,
      events: eventData,
      eventClick: function(event) {
        var event_details = '<b class="title">'+event.title+'</b>';
        var e_startdate = $.fullCalendar.formatDate( event.start, "dd-MM-yyyy");
        if(event.end != null) {
          event_details += '<br><b>Start Date : </b> '+e_startdate;
        }
        else {
          event_details += '<br><b>Date : </b> '+e_startdate;
        }
        if(event.end != null) {
          var e_enddate = $.fullCalendar.formatDate(event.end,"dd-MM-yyyy");
          event_details += '<br><b>End Date : </b> '+e_enddate;
        }
        if(event.description != 'null') {
          event_details += '<br>'+event.description;
        }
        coolgpopup(event_details);
      },
    });
    tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], calendar_getStudentbadge, errorfn);
  }
  else {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      calendarRetrieve('click');
    }
  }
}

function calendar_getStudentbadge(tx,results) {
  if(results.rows.length > 0) {
    var stdbadge = '';
    for(var i=0; i<results.rows.length; i++) {
      stdbadge += '<div class="child">';
      stdbadge += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      stdbadge += '<div class="child_name">'+child_name + "'s Calendar"+'</div>';
      stdbadge += '<div class="child_class">'+results.rows.item(i).class+'</div>';
      stdbadge += '<div class="child_schoolname">'+results.rows.item(i).schoolname+'</div>';
      stdbadge += '</div>';
    }
    $('#student_dashboard_badge').show();
    $('#student_dashboard_badge').html(stdbadge);
  }
}

function getuidSuccess(tx,results) {
  uid = results.rows.item(0).uid ;
}

function successfn() {
  console.log('Retreival success');
}

function getMaxTimestamp(tx,results) {
  $.each(results.rows.item(0), function(key,value){
    window.localStorage.setItem('calendar_timestamp_'+child_nid,value);
  });
}

var db = 0;
function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS INSTITUTE_EVENTS(event_id INT NOT NULL,title,start_date,description,color_code,end_date,timestamp,child_nid INT NOT NULL,PRIMARY KEY(child_nid,event_id))');
  var data = JSON.parse(window.localStorage.getItem('calendarobj'));
  $.each(data, function(key, value) {
    value.title = escape(value.title);
    value.description = escape(value.description);
    tx.executeSql('INSERT OR REPLACE INTO INSTITUTE_EVENTS VALUES ("'+value.event_id+'","'+value.title+'","'+value.start_date+'","'+value.description+'","'+value.color_code+'","'+value.end_date+'","'+value.timestamp+'","'+value.child_nid+'")');
  });
}

function updateDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(handleUpdate,errorfn,successdb);
}

function handleUpdate(tx) {
  tx.executeSql('SELECT * FROM INSTITUTE_EVENTS', [], printRecords, errorfn);
}

function printRecords(tx, results) {
  if(results.rows.length > 0) {
    var data = JSON.parse(window.localStorage.getItem('calendarobj'));
    $.each(data, function(key, value) {
      if(key != 'count') {
        tx.executeSql('DELETE FROM INSTITUTE_EVENTS WHERE event_id ='+value+' AND child_nid ='+child_nid+'');
      }
    });
  }
}

function successdb() {
  console.log("Database has been created successfully");
}

function errorfn(err) {
  console.log("Error processing SQL:" + err.code);
}

function storeuserdata(data) {
  var storage = window.localStorage;
  storage.setItem('calendarobj',JSON.stringify(data));
}

function calendarRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var calendar_timestamp = window.localStorage.getItem('calendar_timestamp_'+child_nid);
    if(eventType == 'refresh') {
      var data = {timestamp : calendar_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
      window.localStorage.setItem('calendar_refresh_'+child_nid,'no');
    }
    else if(eventType == 'click') {
      var data = {username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    }
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/calendar/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        storeuserdata(data);
        createDB();
        calendarOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Calendar Entries");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none' && eventType == 'refresh') {
    coolgalert('No Network Connection');
    return false;
  }
}

function calendarDelete(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var calendar_nids = window.localStorage.getItem('calendar_nids_'+child_nid);
    var data = {check_nodes : calendar_nids,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
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
        updateDB();
        calendarOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Calendar Entries");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
  }
}
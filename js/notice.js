var url = window.location.href;
var child_nid = url.split("?")[1];
child_nid = child_nid.split("&")[0];
child_nid = child_nid.split("=")[1];
var child_name =  url.split("&")[1];
child_name = unescape(child_name.split("=")[1]);
var uid='';
window.localStorage.setItem('notice_refresh_'+child_nid,'yes');

document.addEventListener("deviceready", noticeOnload, false);

$(document).on('click', '#dashboard_menu li a', function () {
  window.location = $(this).attr('href') +"?child_nid="+child_nid + "&child_name="+child_name;
});

$(document).on('click', '#notice_list li a', function () {
  window.localStorage.setItem('notice_prev_back_pos',$(this).offset().top);
  window.location = "noticeentry.html?child_nid="+child_nid +"&nid="+$(this).attr('id');
});

$(window).scroll(function() {
  var scroll = $(window).scrollTop() - ($(document).height() - $(window).height());
  if(scroll >= -10 && scroll <= 10) {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      if(window.localStorage.getItem('notice_full_fetch_'+child_nid) == null) {
        //Fetch only if notices are present.
        noticeRetrieve('swipe');
      }
    }
  }
});

function noticeOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", noticeBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printNoticeEntries,errorfn,successfn);
}

function noticeBackbutton() {
  window.location = "studentdashboard.html?child_nid="+child_nid+"&child_name="+child_name;
}

function noticeRefresh() {
  noticeRetrieve('refresh');
  noticeDelete();
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

function printNoticeEntries(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS NOTICE(nid INT NOT NULL,title,posted_on,body,attachment,attachment_type,timestamp,child_nid INT NOT NULL,PRIMARY KEY(child_nid,nid))');
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM NOTICE WHERE child_nid="' +child_nid+ '" order by timestamp DESC' ,[],printNoticeSuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM NOTICE WHERE child_nid="' +child_nid+'"',[],getMaxTimestamp,errorfn);
}

function printNoticeSuccess(tx,results) {
  var output ="";
  if(results.rows.length > 0) {
    var notice_nids = '';
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      var notice_refresh = window.localStorage.getItem('notice_refresh_'+child_nid);
      var notice_timestamp = window.localStorage.getItem('notice_timestamp_'+child_nid);
      if(notice_refresh == 'yes' && notice_timestamp != null) {
        noticeRetrieve('refresh');
      }
    }
    $.mobile.loading('show');
    tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], notice_getStudentbadge, errorfn);    
    for(var i=0; i<results.rows.length; i++) {
      notice_nids += results.rows.item(i).nid +',';
      var noticeResult = "";
      noticeResult += '<div class="icon"><img src="images/notice_icon.png"/></div>';
      noticeResult += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
      if(results.rows.item(i).attachment_type != "NULL") {
        noticeResult += '<div class="attachment_list"><img src="images/attachment.png"/></div>'; 
      }
      if(results.rows.item(i).title.length > 25) {
        var title = results.rows.item(i).title.substr(0,25) + '...';
      }
      else {
        var title = results.rows.item(i).title;
			}
      noticeResult += '<div class="title">'+title+'</div>';
      if(results.rows.item(i).body != "NULL") {
        var notice_body = unescape(results.rows.item(i).body);
        notice_body = notice_body.replace(/(<([^>]+)>)/ig,""); // Trim HTML Tags
        if(notice_body.length > 120) {
          notice_body = notice_body.substr(0,120) + '...';
        }
        noticeResult += '<div class="body list_body">'+notice_body+'</div>';
      }
      output += '<li><a id="'+results.rows.item(i).nid +'" href="#">'+noticeResult+'</a></li>';
    }
    window.localStorage.setItem('notice_nids_'+child_nid,notice_nids);
    $("#notice_entries ul").html(output).listview('refresh');
    $.mobile.loading('hide');
    //Scroll to prev read notice position
    var notice_prev_back_pos = Number(window.localStorage.getItem('notice_prev_back_pos'));
    if(notice_prev_back_pos != 0) {
      notice_prev_back_pos = Number(notice_prev_back_pos) - Number(35);
      $.mobile.silentScroll(notice_prev_back_pos);
    }
  }
  else {
    if(window.localStorage.getItem('notice_full_fetch_'+child_nid) == null) {
      var networkState = navigator.connection.type;
      if(networkState != 'none') {
        noticeRetrieve('swipe');
      }
    }
    else if(window.localStorage.getItem('notice_full_fetch_'+child_nid) == 'YES') {
      tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], notice_getStudentbadge, errorfn);    
      $("#notice_entries").html("<center><b><span style=color:#C60000;margin-top:20px;>No Entries Found</span></b></center>");
      return false;
    }
  }
}

function notice_getStudentbadge(tx,results) {
  if(results.rows.length > 0) {
    var stdbadge = '';
    for(var i=0; i<results.rows.length; i++) {
      stdbadge += '<div class="child">';
      stdbadge += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      stdbadge += '<div class="child_name">'+child_name + "'s Noticeboard"+'</div>';
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
    window.localStorage.setItem('notice_timestamp_'+child_nid,value);
  });
}

var db = 0;
function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS NOTICE(nid INT NOT NULL,title,posted_on,body,attachment,attachment_type,timestamp,child_nid INT NOT NULL,PRIMARY KEY(child_nid,nid))');
  var data = JSON.parse(window.localStorage.getItem('noticeobj'));
  $.each(data, function(key, value) {
    if(key != 'notice_count') {
      value.body = escape(value.body);
      tx.executeSql('INSERT OR REPLACE INTO NOTICE VALUES ("'+value.nid+'","'+value.title+'","'+value.posted_on+'","'+value.body+'","'+value.attachment+'","'+value.attachment_type+'","'+value.timestamp+'","'+value.child_nid+'")');
    }
  });
}

function updateDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(handleUpdate,errorfn,successdb);
}

function handleUpdate(tx) {
  tx.executeSql('SELECT * FROM NOTICE', [], printRecords, errorfn);
}

function printRecords(tx, results) {
  if(results.rows.length > 0) {
    var data = JSON.parse(window.localStorage.getItem('noticeobj'));
    $.each(data, function(key, value) {
      if(key != 'count') {
        tx.executeSql('DELETE FROM NOTICE WHERE nid ='+value+' AND child_nid ='+child_nid+'');
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
  storage.setItem('noticeobj',JSON.stringify(data));
}

function noticeRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    window.localStorage.setItem('notice_prev_back_pos',0);
    if(window.localStorage.getItem('notice_index_'+child_nid) == null) {
      window.localStorage.setItem('notice_index_'+child_nid,0);
    }
    var notice_index = window.localStorage.getItem('notice_index_'+child_nid);
    var notice_timestamp = window.localStorage.getItem('notice_timestamp_'+child_nid);
    if(eventType == 'refresh') {
      var data = {timestamp : notice_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
      window.localStorage.setItem('notice_refresh_'+child_nid,'no');
    }
    else if(eventType == 'swipe') {
      var data = {index : notice_index,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    }
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/notice/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        if(data.notice_count == 0 && eventType == 'swipe') {
          window.localStorage.setItem('notice_full_fetch_'+child_nid,'YES');
        }
        storeuserdata(data);
        notice_index = Number(window.localStorage.getItem('notice_index_'+child_nid)) + Number(data.notice_count);
        window.localStorage.setItem('notice_index_'+child_nid,notice_index);
        createDB();
        noticeOnload();
      },
      error:function(error,textStatus,errorThrown) {
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none' && eventType == 'refresh') {
    coolgalert('No Network Connection');
    return false;
  }
}

function noticeDelete(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var notice_nids = window.localStorage.getItem('notice_nids_'+child_nid);
    var data = {check_nodes : notice_nids,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
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
        notice_index = Number(window.localStorage.getItem('notice_index_'+child_nid)) - Number(data.count);
        window.localStorage.setItem('notice_index_'+child_nid,notice_index);
        updateDB();
        noticeOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Notice Entries");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
  }
}
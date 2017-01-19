var url = window.location.href;
var child_nid = url.split("?")[1];
child_nid = child_nid.split("&")[0];
child_nid = child_nid.split("=")[1];
var child_name =  url.split("&")[1];
child_name = unescape(child_name.split("=")[1]);
var uid='';
window.localStorage.setItem('classwork_refresh_'+child_nid,'yes');

document.addEventListener("deviceready", classworkOnload, false);

$(document).on('click', '#dashboard_menu li a', function () {
  window.location = $(this).attr('href') +"?child_nid="+child_nid + "&child_name="+child_name;
});

$(document).on('click', '#cw_list li a', function () {
  window.localStorage.setItem('classwork_prev_back_pos',$(this).offset().top);
  window.location = "classworkentry.html?child_nid="+child_nid +"&cw_nid=" +$(this).attr('id');
});

$(window).scroll(function() {
  var scroll = $(window).scrollTop() - ($(document).height() - $(window).height());
  if(scroll >= -10 && scroll <= 10) {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      if(window.localStorage.getItem('classwork_full_fetch_'+child_nid) == null) {
        //Fetch only if classwork entries are present.
        classworkRetrieve('swipe');
      }
    }
  }
});

function classworkOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", classworkBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printClassworkEntries,errorfn,successfn);
}

function classworkBackbutton() {
  window.location = "studentdashboard.html?child_nid="+child_nid+"&child_name="+child_name;
}

function classworkRefresh() {
  classworkRetrieve('refresh');
  classworkDelete();
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

function printClassworkEntries(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS CLASSWORK(child_nid INT NOT NULL,cw_nid INT NOT NULL,title,subject,posted_on,body,details,submission,attachment,attachment_type,timestamp,PRIMARY KEY(child_nid,cw_nid))');
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM CLASSWORK WHERE child_nid="' +child_nid+ '" order by timestamp DESC' ,[],printClassworkSuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM CLASSWORK WHERE child_nid="' +child_nid+'"',[],getMaxTimestamp,errorfn);
}

function printClassworkSuccess(tx,results) {
  var output ="";
  if(results.rows.length > 0) {
    var classwork_nids = '';
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      var classwork_refresh = window.localStorage.getItem('classwork_refresh_'+child_nid);
      var cw_timestamp = window.localStorage.getItem('cw_timestamp_'+child_nid);
      if(classwork_refresh == 'yes' && cw_timestamp != null) {
        classworkRetrieve('refresh');
      }
    }
    $.mobile.loading('show');
    tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], classwork_getStudentbadge, errorfn);
    for(var i=0; i<results.rows.length; i++) {
      classwork_nids += results.rows.item(i).cw_nid +',';
      var cwResult = "";
      cwResult += '<div class="icon"><img src="images/cw_icon.png"/></div>';
      cwResult += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
      if(results.rows.item(i).attachment_type != "NULL") {
        cwResult += '<div class="attachment_list"><img src="images/attachment.png"/></div>'; 
      }
      if(results.rows.item(i).title.length > 25) {
        var cw_title = unescape(results.rows.item(i).title).substring(0,25) + '...';
      }
      else {
        var cw_title = unescape(results.rows.item(i).title);
      }
      cwResult += '<div class="title">'+cw_title+'</div>';
      if(results.rows.item(i).body != "NULL") {
      var cw_body = unescape(results.rows.item(i).body);
        cw_body = cw_body.replace(/(<([^>]+)>)/ig,""); // Trim HTML Tags
        if(cw_body.length > 120) {
          cw_body = cw_body.substr(0,120) + '...';
        }
        cwResult += '<div class="body list_body">'+cw_body+'</div>';
      }
      output += '<li><a id="'+results.rows.item(i).cw_nid +'" href="#">'+cwResult+'</a></li>';
    }
    window.localStorage.setItem('classwork_nids_'+child_nid,classwork_nids);
    $("#classwork_entries ul").html(output).listview('refresh');
    $.mobile.loading('hide');
    //Scroll to prev read classwork position
    var classwork_prev_back_pos = Number(window.localStorage.getItem('classwork_prev_back_pos'));
    if(classwork_prev_back_pos != 0) {
      classwork_prev_back_pos = Number(classwork_prev_back_pos) - Number(35);
      $.mobile.silentScroll(classwork_prev_back_pos);
    }
  }
  else {
    if(window.localStorage.getItem('classwork_full_fetch_'+child_nid) == null) {
      var networkState = navigator.connection.type;
      if(networkState != 'none') {
        classworkRetrieve('swipe');
      }
    }
    else if(window.localStorage.getItem('classwork_full_fetch_'+child_nid) == 'YES') {
      tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], classwork_getStudentbadge, errorfn);
      $("#classwork_entries").html("<center><b><span style=color:#C60000;margin-top:20px;>No Entries Found</span></b></center>");
      return false;
    }
  }
}

function classwork_getStudentbadge(tx,results) {
  if(results.rows.length > 0) {
    var stdbadge = '';
    for(var i=0; i<results.rows.length; i++) {
      stdbadge += '<div class="child">';
      stdbadge += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      stdbadge += '<div class="child_name">'+child_name + "'s Classwork"+'</div>';
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
    window.localStorage.setItem('cw_timestamp_'+child_nid,value);
  });
}

var db = 0;
function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS CLASSWORK(child_nid INT NOT NULL,cw_nid INT NOT NULL,title,subject,posted_on,body,details,submission,attachment,attachment_type,timestamp,PRIMARY KEY(child_nid,cw_nid))');
  var data = JSON.parse(window.localStorage.getItem('classworkobj'));
  $.each(data, function(key, value) {
    if(key != 'cw_count') {
      value.body = escape(value.body);
      value.title = escape(value.title);
      value.details = escape(value.details);
      tx.executeSql('INSERT OR REPLACE INTO CLASSWORK VALUES ("'+value.child_nid+'","'+value.cw_nid+'","'+value.title+'","'+value.subject+'","'+value.posted_on+'","'+value.body+'","'+value.details+'","'+value.submission+'","'+value.attachment+'","'+value.attachment_type+'","'+value.timestamp+'")');
    }
  });
}

function updateDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(handleUpdate,errorfn,successdb);
}

function handleUpdate(tx) {
  tx.executeSql('SELECT * FROM CLASSWORK', [], printRecords, errorfn);
}

function printRecords(tx, results) {
  if(results.rows.length > 0) {
    var data = JSON.parse(window.localStorage.getItem('classworkobj'));
    $.each(data, function(key, value) {
      if(key != 'count') {
        tx.executeSql('DELETE FROM CLASSWORK WHERE cw_nid ='+value+' AND child_nid ='+child_nid+'');
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
  storage.setItem('classworkobj',JSON.stringify(data));
}

function classworkRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    window.localStorage.setItem('classwork_prev_back_pos',0);
    if(window.localStorage.getItem('cw_index_'+child_nid) == null) {
      window.localStorage.setItem('cw_index_'+child_nid,0);
    }
    var cw_index = window.localStorage.getItem('cw_index_'+child_nid);
    var cw_timestamp = window.localStorage.getItem('cw_timestamp_'+child_nid);
    if(eventType == 'refresh') {
      var data = {timestamp : cw_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
      window.localStorage.setItem('classwork_refresh_'+child_nid,'no');
    }
    else if(eventType == 'swipe') {
      var data = {index : cw_index,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    }
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/classwork/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        if(data.cw_count == 0 && eventType == 'swipe') {
          window.localStorage.setItem('classwork_full_fetch_'+child_nid,'YES');
        }
        storeuserdata(data);
        cw_index = Number(window.localStorage.getItem('cw_index_'+child_nid)) + Number(data.cw_count);
        window.localStorage.setItem('cw_index_'+child_nid,cw_index);
        createDB();
        classworkOnload();
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

function classworkDelete(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var classwork_nids = window.localStorage.getItem('classwork_nids_'+child_nid);
    var data = {check_nodes : classwork_nids,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
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
        cw_index = Number(window.localStorage.getItem('cw_index_'+child_nid)) - Number(data.count);
        window.localStorage.setItem('cw_index_'+child_nid,cw_index);
        updateDB();
        classworkOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Classwork Entries");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
  }
}
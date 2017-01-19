var url = window.location.href;
var child_nid = url.split("?")[1];
child_nid = child_nid.split("&")[0];
child_nid = child_nid.split("=")[1];
var child_name =  url.split("&")[1];
child_name = unescape(child_name.split("=")[1]);
var uid='';
window.localStorage.setItem('nl_refresh_'+child_nid,'yes');

document.addEventListener("deviceready", nlOnload, false);

$(document).on('click', '#dashboard_menu li a', function () {
  window.location = $(this).attr('href') +"?child_nid="+child_nid + "&child_name="+child_name;
});

$(document).on('click', '#nl_list li a', function () {
  window.localStorage.setItem('nl_prev_back_pos',$(this).offset().top);
  window.location = "nlentry.html?child_nid="+child_nid +"&nl_nid=" +$(this).attr('id');
});

$(window).scroll(function() {
  var scroll = $(window).scrollTop() - ($(document).height() - $(window).height());
  if(scroll >= -10 && scroll <= 10) {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      if(window.localStorage.getItem('nl_full_fetch_'+child_nid) == null) {
        //Fetch only if newsletter entries are present.
        nlRetrieve('swipe');
      }
    }
  }
});

function nlOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", nlBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printNlEntries,errorfn,successfn);
}

function nlBackbutton() {
  window.location = "studentdashboard.html?child_nid="+child_nid+"&child_name="+child_name;
}

function nlRefresh() {
  nlRetrieve('refresh');
  nlDelete();
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

function printNlEntries(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS NEWSLETTER(child_nid INT NOT NULL,nl_nid INT NOT NULL,title,posted_on,body,attachment,attachment_type,timestamp,PRIMARY KEY(child_nid,nl_nid))');
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM NEWSLETTER WHERE child_nid="' +child_nid+ '" order by timestamp DESC' ,[],printNlSuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM NEWSLETTER WHERE child_nid="' +child_nid+'"',[],getMaxTimestamp,errorfn);
}

function printNlSuccess(tx,results) {
  var output ="";
  if(results.rows.length > 0) {
    var nl_nids = '';
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      var nl_refresh = window.localStorage.getItem('nl_refresh_'+child_nid);
      var nl_timestamp = window.localStorage.getItem('nl_timestamp_'+child_nid);
      if(nl_refresh == 'yes' && nl_timestamp != null) {
        nlRetrieve('refresh');
      }
    }
    $.mobile.loading('show');
    tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], nl_getStudentbadge, errorfn);
    for(var i=0; i<results.rows.length; i++) {
      nl_nids += results.rows.item(i).nl_nid +',';
      var nlResult = "";
      nlResult += '<div class="icon"><img src="images/nl_icon.png"/></div>';
      nlResult += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
      if(results.rows.item(i).attachment_type != "NULL") {
        nlResult += '<div class="attachment_list"><img src="images/attachment.png"/></div>'; 
      }
      if(results.rows.item(i).title.length > 25) {
        var nl_title = results.rows.item(i).title.substr(0,25) + '...';
      }
      else {
        var nl_title = results.rows.item(i).title;
      }
      nlResult += '<div class="title">'+nl_title+'</div>';
      output += '<li><a id="'+results.rows.item(i).nl_nid +'" href="#">'+nlResult+'</a></li>';
    }
    window.localStorage.setItem('nl_nids_'+child_nid,nl_nids);
    $("#nl_entries ul").html(output).listview('refresh');
    $.mobile.loading('hide');
    //Scroll to prev read newsletter position
    var nl_prev_back_pos = Number(window.localStorage.getItem('nl_prev_back_pos'));
    if(nl_prev_back_pos != 0) {
      nl_prev_back_pos = Number(nl_prev_back_pos) - Number(35);
      $.mobile.silentScroll(nl_prev_back_pos);
    }
  }
  else {
    if(window.localStorage.getItem('nl_full_fetch_'+child_nid) == null) {
      var networkState = navigator.connection.type;
      if(networkState != 'none') {
        nlRetrieve('swipe');
      }
    }
    else if(window.localStorage.getItem('nl_full_fetch_'+child_nid) == 'YES') {
      tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], nl_getStudentbadge, errorfn);
      $("#nl_entries").html("<center><b><span style=color:#C60000;margin-top:20px;>No Entries Found</span></b></center>");
      return false;
    }
  }
}

function nl_getStudentbadge(tx,results) {
  if(results.rows.length > 0) {
    var stdbadge = '';
    for(var i=0; i<results.rows.length; i++) {
      stdbadge += '<div class="child">';
      stdbadge += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      stdbadge += '<div class="child_name">'+child_name + "'s Newsletter"+'</div>';
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
    window.localStorage.setItem('nl_timestamp_'+child_nid,value);
  });
}

var db = 0;
function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS NEWSLETTER(child_nid INT NOT NULL,nl_nid INT NOT NULL,title,posted_on,body,attachment,attachment_type,timestamp,PRIMARY KEY(child_nid,nl_nid))');
  var data = JSON.parse(window.localStorage.getItem('nlobj'));
  $.each(data, function(key, value) {
    if(key != 'nl_count') {
      value.body = escape(value.body);
      tx.executeSql('INSERT OR REPLACE INTO NEWSLETTER VALUES ("'+value.child_nid+'","'+value.nl_nid+'","'+value.title+'","'+value.posted_on+'","'+value.body+'","'+value.attachment+'","'+value.attachment_type+'","'+value.timestamp+'")');
    }
  });
}

function updateDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(handleUpdate,errorfn,successdb);
}

function handleUpdate(tx) {
  tx.executeSql('SELECT * FROM NEWSLETTER', [], printRecords, errorfn);
}

function printRecords(tx, results) {
  if(results.rows.length > 0) {
    var data = JSON.parse(window.localStorage.getItem('nlobj'));
    $.each(data, function(key, value) {
      if(key != 'count') {
        tx.executeSql('DELETE FROM NEWSLETTER WHERE nl_nid ='+value+' AND child_nid ='+child_nid+'');
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
  storage.setItem('nlobj',JSON.stringify(data));
}

function nlRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    window.localStorage.setItem('nl_prev_back_pos',0);
    if(window.localStorage.getItem('nl_index_'+child_nid) == null) {
      window.localStorage.setItem('nl_index_'+child_nid,0);
    }
    var nl_index = window.localStorage.getItem('nl_index_'+child_nid);
    var nl_timestamp = window.localStorage.getItem('nl_timestamp_'+child_nid);
    if(eventType == 'refresh') {
      var data = {timestamp : nl_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
      window.localStorage.setItem('nl_refresh_'+child_nid,'no');
    }
    else if(eventType == 'swipe') {
      var data = {index : nl_index,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    }
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/newsletter/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        if(data.nl_count == 0 && eventType == 'swipe') {
          window.localStorage.setItem('nl_full_fetch_'+child_nid,'YES');
        }
        storeuserdata(data);
        nl_index = Number(window.localStorage.getItem('nl_index_'+child_nid)) + Number(data.nl_count);
        window.localStorage.setItem('nl_index_'+child_nid,nl_index);
        createDB();
        nlOnload();
      },
      error:function(error,textStatus,errorThrown) {
    	coolgalert("Unable to Fetch Newsletter Entries");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none' && eventType == 'refresh') {
    coolgalert('No Network Connection');
    return false;
  }
}

function nlDelete(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var nl_nids = window.localStorage.getItem('nl_nids_'+child_nid);
    var data = {check_nodes : nl_nids,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
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
        nl_index = Number(window.localStorage.getItem('nl_index_'+child_nid)) - Number(data.count);
        window.localStorage.setItem('nl_index_'+child_nid,nl_index);
        updateDB();
        nlOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Newsletter Entries");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
  }
}
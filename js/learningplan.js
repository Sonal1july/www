var url = window.location.href;
var child_nid = url.split("?")[1];
child_nid = child_nid.split("&")[0];
child_nid = child_nid.split("=")[1];
var child_name =  url.split("&")[1];
child_name = unescape(child_name.split("=")[1]);
var uid='';
window.localStorage.setItem('lp_refresh_'+child_nid,'yes');

document.addEventListener("deviceready", lpOnload, false);

$(document).on('click', '#dashboard_menu li a', function () {
  window.location = $(this).attr('href') +"?child_nid="+child_nid + "&child_name="+child_name;
});

$(document).on('click', '#lp_list li a', function () {
  window.localStorage.setItem('lp_prev_back_pos',$(this).offset().top);
  window.location = "learningplanentry.html?child_nid="+child_nid +"&nid="+$(this).attr('id');
});

$(window).scroll(function() {
  var scroll = $(window).scrollTop() - ($(document).height() - $(window).height());
  if(scroll >= -10 && scroll <= 10) {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      if(window.localStorage.getItem('lp_full_fetch_'+child_nid) == null) {
        //Fetch only if learning plan entries are present.
        lpRetrieve('swipe');
      }
    }
  }
});

function lpOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", learningplanBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printLpEntries,errorfn,successfn);
}

function learningplanBackbutton() {
  window.location = "studentdashboard.html?child_nid="+child_nid+"&child_name="+child_name;
}

function lpRefresh() {
  lpRetrieve('refresh');
  lpDelete();
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

function printLpEntries(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS LEARNINGPLAN(nid INT NOT NULL,lp_define_value INT NOT NULL,lp_title,posted_on,topic_title,topic_body,attachment,attachment_type,timestamp,child_nid INT NOT NULL,PRIMARY KEY(child_nid,nid,lp_define_value))');
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM LEARNINGPLAN WHERE child_nid="' +child_nid+ '" order by timestamp DESC' ,[],printLpSuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM LEARNINGPLAN WHERE child_nid="' +child_nid+'"',[],getMaxTimestamp,errorfn);
}

function printLpSuccess(tx,results) {
  var output ="";
  if(results.rows.length > 0) {
    var lp_nids = '';
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      var lp_refresh = window.localStorage.getItem('lp_refresh_'+child_nid);
      var lp_timestamp = window.localStorage.getItem('lp_timestamp_'+child_nid);
      if(lp_refresh == 'yes' && lp_timestamp != null) {
        lpRetrieve('refresh');
      }
    }
    $.mobile.loading('show');
    tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], learningplan_getStudentbadge, errorfn);    
    for(var i=0; i<results.rows.length; i++) {
      var lp_id = results.rows.item(i).nid+'_'+results.rows.item(i).lp_define_value;
      lp_nids += lp_id +',';
      var lpResult = "";
      lpResult += '<div class="icon"><img src="images/lp_icon.png"/></div>';
      lpResult += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
      if(results.rows.item(i).attachment_type != "NULL") {
        lpResult += '<div class="attachment_list"><img src="images/attachment.png"/></div>'; 
      }      
      if(results.rows.item(i).lp_title.length > 25) {
        var lp_title = results.rows.item(i).lp_title.substr(0,25) + '...';
      }
      else {
        var lp_title = results.rows.item(i).lp_title;
      }
      lpResult += '<div class="title">'+lp_title+'</div>';
      if(results.rows.item(i).topic_title.length > 25) {
        var topic_title = unescape(results.rows.item(i).topic_title).substr(0,25) + '...';
      }
      else {
        var topic_title = unescape(results.rows.item(i).topic_title);
      }
      lpResult += '<div class="title">'+topic_title+'</div>';
      output += '<li><a id="'+results.rows.item(i).nid+'_'+results.rows.item(i).lp_define_value+'" href="#">'+lpResult+'</a></li>';
    }
    window.localStorage.setItem('lp_nids_'+child_nid,lp_nids);
    $("#lp_entries ul").html(output).listview('refresh');
    $.mobile.loading('hide');
    //Scroll to prev read learning plan position
    var lp_prev_back_pos = Number(window.localStorage.getItem('lp_prev_back_pos'));
    if(lp_prev_back_pos != 0) {
      lp_prev_back_pos = Number(lp_prev_back_pos) - Number(35);
      $.mobile.silentScroll(lp_prev_back_pos);
    }
  }
  else {
    if(window.localStorage.getItem('lp_full_fetch_'+child_nid) == null) {
      var networkState = navigator.connection.type;
      if(networkState != 'none') {
        lpRetrieve('swipe');
      }
    }
    else if(window.localStorage.getItem('lp_full_fetch_'+child_nid) == 'YES') {      
      tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], learningplan_getStudentbadge, errorfn);
      $("#lp_entries").html("<center><b><span style=color:#C60000;margin-top:20px;>No Entries Found</span></b></center>");
      return false;
    }
  }
}

function learningplan_getStudentbadge(tx,results) {
  if(results.rows.length > 0) {
    var stdbadge = '';
    for(var i=0; i<results.rows.length; i++) {
      stdbadge += '<div class="child">';
      stdbadge += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      stdbadge += '<div class="child_name">'+child_name + "'s Learning plan"+'</div>';
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
    window.localStorage.setItem('lp_timestamp_'+child_nid,value);
  });
}

var db = 0;
function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS LEARNINGPLAN(nid INT NOT NULL,lp_define_value INT NOT NULL,lp_title,posted_on,topic_title,topic_body,attachment,attachment_type,timestamp,child_nid INT NOT NULL,PRIMARY KEY(child_nid,nid,lp_define_value))');
  var data = JSON.parse(window.localStorage.getItem('lpobj'));
  $.each(data, function(key, value) {
    if(key != 'lp_count') {
		  value.topic_body = escape(value.topic_body);
			value.topic_title = escape(value.topic_title);
      tx.executeSql('INSERT OR REPLACE INTO LEARNINGPLAN VALUES ("'+value.nid+'","'+value.lp_define_value+'","'+value.lp_title+'","'+value.posted_on+'","'+value.topic_title+'","'+value.topic_body+'","'+value.attachment+'","'+value.attachment_type+'","'+value.timestamp+'","'+value.child_nid+'")');
    }
  });
}

function updateDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(handleUpdate,errorfn,successdb);
}

function handleUpdate(tx) {
  tx.executeSql('SELECT * FROM LEARNINGPLAN', [], printRecords, errorfn);
}

function printRecords(tx, results) {
  if(results.rows.length > 0) {
    var data = JSON.parse(window.localStorage.getItem('lpobj'));
    $.each(data, function(key, value) {
      if(key != 'count') {
        var drs_delete_nid = value.split("_");
        tx.executeSql('DELETE FROM LEARNINGPLAN WHERE nid ='+drs_delete_nid[0]+' AND lp_define_value ='+drs_delete_nid[1]+' AND child_nid ='+child_nid+'');
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
  storage.setItem('lpobj',JSON.stringify(data));
}

function lpRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    window.localStorage.setItem('lp_prev_back_pos',0);
    if(window.localStorage.getItem('lp_index_'+child_nid) == null) {
      window.localStorage.setItem('lp_index_'+child_nid,0);
    }
    var lp_index = window.localStorage.getItem('lp_index_'+child_nid);
    var lp_timestamp = window.localStorage.getItem('lp_timestamp_'+child_nid);
    if(eventType == 'refresh') {
      var data = {timestamp : lp_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
      window.localStorage.setItem('lp_refresh_'+child_nid,'no');
    }
    else if(eventType == 'swipe') {
      var data = {index : lp_index,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    }
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/learningplan/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        if(data.lp_count == 0 && eventType == 'swipe') {
          window.localStorage.setItem('lp_full_fetch_'+child_nid,'YES');
        }
        storeuserdata(data);
        lp_index = Number(window.localStorage.getItem('lp_index_'+child_nid)) + Number(data.lp_count);
        window.localStorage.setItem('lp_index_'+child_nid,lp_index);
        createDB();
        lpOnload();
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

function lpDelete(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var lp_nids = window.localStorage.getItem('lp_nids_'+child_nid);
    var data = {check_nodes : lp_nids,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
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
        lp_index = Number(window.localStorage.getItem('lp_index_'+child_nid)) - Number(data.count);
        window.localStorage.setItem('lp_index_'+child_nid,lp_index);
        updateDB();
        lpOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Learning plan Entries");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
  }
}
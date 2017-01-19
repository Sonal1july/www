var url = window.location.href;
var child_nid = url.split("?")[1];
child_nid = child_nid.split("&")[0];
child_nid = child_nid.split("=")[1];
var child_name =  url.split("&")[1];
child_name = unescape(child_name.split("=")[1]);
var uid='';
window.localStorage.setItem('diary_refresh_'+child_nid,'yes');

document.addEventListener("deviceready", diaryOnload, false);

$(document).on('click', '#dashboard_menu li a', function () {
  window.location = $(this).attr('href') +"?child_nid="+child_nid + "&child_name="+child_name;
});

$(document).on('click', '#diary_list li a', function () {
  window.localStorage.setItem('diary_prev_back_pos',$(this).offset().top);
  window.location = "diaryentry.html?child_nid="+child_nid +"&diary_nid=" +$(this).attr('id');
});

function diaryOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", diaryBackbutton, false);
  setTimeout(checkConnection(),30000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printDiaryEntries,errorfn,successfn);
}

function diaryBackbutton() {
  window.location = "studentdashboard.html?child_nid="+child_nid+"&child_name="+child_name;
}

function diaryRefresh() {
  diaryRetrieve('refresh');
  diaryDelete();
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

function printDiaryEntries(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS DIARY(diary_nid INT NOT NULL,diary_title,diary_body,posted_on,due_date,attachment,attachment_type,response,response_options,timestamp,child_nid INT NOT NULL,PRIMARY KEY(child_nid,diary_nid))');
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM DIARY WHERE child_nid="' +child_nid+ '" order by timestamp DESC',[],printDiarySuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM DIARY WHERE child_nid="' +child_nid+'"',[],getMaxTimestamp,errorfn);
}

function printDiarySuccess(tx,results) {
  if(results.rows.length > 0) {
    var output = '';
    var diary_nids = '';
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      var diary_refresh = window.localStorage.getItem('diary_refresh_'+child_nid);
      var diary_timestamp = window.localStorage.getItem('diary_timestamp_'+child_nid);
      if(diary_refresh == 'yes' && diary_timestamp != null) {
        diaryRetrieve('refresh');
      }
    }
    $.mobile.loading('show');
    tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], diary_getStudentbadge, errorfn);
    tx.executeSql('SELECT * FROM TABSETTINGS_NEW WHERE child_nid="' +child_nid+ '"' ,[],getTabSettingsSuccess,errorfn);
    for(var i=0; i<results.rows.length; i++) {
      diary_nids += results.rows.item(i).diary_nid +',';
      output += '<li><a id="'+results.rows.item(i).diary_nid +'" href="#">';
      output += '<div class="icon"><img src="images/diary_icon.png"/></div>';
      output += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
      if(results.rows.item(i).attachment_type != "NULL") {
        output += '<div class="attachment_list"><img src="images/attachment.png"/></div>'; 
      }
      if(results.rows.item(i).diary_title.length > 20) {
        var title = unescape(results.rows.item(i).diary_title).substring(0,25) + '...';
      } else {
        var title = unescape(results.rows.item(i).diary_title);
      }
      output += '<div class="title">'+title+'</div>';
      if(results.rows.item(i).diary_body != "null") {
        var body = unescape(results.rows.item(i).diary_body);
        body = body.replace(/(<([^>]+)>)/ig,""); // Trim HTML Tags
        if(body.length > 120) {
          body = body.substr(0,120) + '...';
        }
        output += '<div class="body list_body">'+body+'</div>';
      }
      output += '</a></li>';
    }
    window.localStorage.setItem('diary_nids_'+child_nid,diary_nids);
    $("#diary_entries ul").html(output).listview('refresh');
    $.mobile.loading('hide');
    //Scroll to prev read article position
    var diary_prev_back_pos = Number(window.localStorage.getItem('diary_prev_back_pos'));
    if(diary_prev_back_pos != 0) {
      diary_prev_back_pos = Number(diary_prev_back_pos) - Number(35);
      $.mobile.silentScroll(diary_prev_back_pos);
    }
  }
  else {
    if(window.localStorage.getItem('dairy_full_fetch_'+child_nid) == null) {
      var networkState = navigator.connection.type;
      if(networkState != 'none') {
        diaryRetrieve('swipe');
      }
    }
    else if(window.localStorage.getItem('dairy_full_fetch_'+child_nid) == 'YES') {
      tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], diary_getStudentbadge, errorfn);
      $("#diary_entries").html("<center><b><span style=color:#C60000;margin-top:20px;>No Entries Found</span></b></center>");
      return false;
    }
  }
}

function diary_getStudentbadge(tx,results) {
  if(results.rows.length > 0) {
    var stdbadge = '';
    for(var i=0; i<results.rows.length; i++) {
      stdbadge += '<div class="child">';
      stdbadge += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      stdbadge += '<div class="child_name">'+child_name + "'s Diary"+'</div>';
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
    window.localStorage.setItem('diary_timestamp_'+child_nid,value);
  });
}

function getuidSuccess(tx,results) {
  uid = results.rows.item(0).uid ;
}

function getTabSettingsSuccess(tx,results) {
  if(results.rows.length > 0) {
    for(var i=0; i<results.rows.length; i++) {
      if(results.rows.item(i).tab_name == 'write_to_diary' && results.rows.item(i).tab_name == results.rows.item(i).tab_value) {
        $("#write_to_diary").show();
      }
    }
  }
  else {
    $("#write_to_diary").hide();
  }
}

function successfn() {
  console.log('Retreival success');
}

function storeuserdata(data) {
  var storage = window.localStorage;
  storage.setItem('diaryobj',JSON.stringify(data));
}

var db = 0;
function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS DIARY(diary_nid INT NOT NULL,diary_title,diary_body,posted_on,due_date,attachment,attachment_type,response,response_options,timestamp,child_nid INT NOT NULL,PRIMARY KEY(child_nid,diary_nid))');
  var data = JSON.parse(window.localStorage.getItem('diaryobj'));
  $.each(data, function(key, value) {
    if(key != 'diarycount') {
      value.diary_body = escape(value.diary_body);
      value.diary_title = escape(value.diary_title);
        tx.executeSql('INSERT OR REPLACE INTO DIARY VALUES ("'+value.diary_nid+'","'+value.diary_title+'","'+value.diary_body+'","'+value.posted_on+'","'+value.due_date+'","'+value.attachment+'","'+value.attachment_type+'","'+value.response+'","'+value.response_options+'","'+value.timestamp+'","'+value.child_nid+'")');
    }
  });
}

function updateDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(handleUpdate,errorfn,successdb);
}

function handleUpdate(tx) {
  tx.executeSql('SELECT * FROM DIARY', [], printRecords, errorfn);
}

function printRecords(tx, results) {
  if(results.rows.length > 0) {
    var data = JSON.parse(window.localStorage.getItem('diaryobj'));
    $.each(data, function(key, value) {
      if(key != 'count') {
        tx.executeSql('DELETE FROM DIARY WHERE diary_nid ='+value+' AND child_nid ='+child_nid+'');
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

function storeuserdata(data) {
  var storage = window.localStorage;
  storage.setItem('diaryobj',JSON.stringify(data));
}

function diaryRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    window.localStorage.setItem('diary_prev_back_pos',0);
    if(window.localStorage.getItem('diary_index_'+child_nid) == null) {
      window.localStorage.setItem('diary_index_'+child_nid,0);
    }
    var diary_index = window.localStorage.getItem('diary_index_'+child_nid);
    var diary_timestamp = window.localStorage.getItem('diary_timestamp_'+child_nid);
    if(eventType == 'refresh') {
      var data = {timestamp : diary_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
      window.localStorage.setItem('diary_refresh_'+child_nid,'no');
    }
    else if(eventType == 'swipe') {
      var data = {index : diary_index,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    }
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/diary/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        if(data.diarycount == 0 && eventType == 'swipe') {
          window.localStorage.setItem('dairy_full_fetch_'+child_nid,'YES');
        }
        storeuserdata(data);
        diary_index = Number(window.localStorage.getItem('diary_index_'+child_nid)) + Number(data.diarycount);
        window.localStorage.setItem('diary_index_'+child_nid,diary_index);
        createDB();
        diaryOnload();
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

function diaryDelete(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var diary_nids = window.localStorage.getItem('diary_nids_'+child_nid);
    var data = {check_nodes : diary_nids,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
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
        diary_index = Number(window.localStorage.getItem('diary_index_'+child_nid)) - Number(data.count);
        window.localStorage.setItem('diary_index_'+child_nid,diary_index);
        updateDB();
        diaryOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Diary Entries");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
  }
}

function writeToDiary() {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var diary_body =  $('#write_to_diary .diarybody').val();
    if(diary_body == '') {
      coolgalert('Please Enter the Message');
      $('#write_to_diary .diarybody').focus();
      return false;
    }
    $.ajax({
      type: 'POST',
      url: coolgmapp_settings_app_site_url + '/coolgmapp/post_diary/'+ uid + '/' + child_nid,
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      data       : {diary_post : diary_body,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')},
      contentType: "application/json",
      dataType: 'jsonp',
      success:function(data) {
        if(data == 'true') {
          $('#write_to_diary .diarybody').val("");
          coolgalert('Your Diary has been Posted');
          diaryRetrieve('refresh');
        }
        else if(data == 'false') {
          $('#write_to_diary .diarybody').val("");
          $('#write_to_diary .diarybody').focus();
          coolgalert('Unable to Post Diary');
        }
      },
      error:function(error,textStatus,errorThrown) {
        $('#write_to_diary .diarybody').val("");
        $('#write_to_diary .diarybody').focus();
        coolgalert('Unable to Post Diary');
        console.log(errorThrown);
      }
    });
  }
  else {
    coolgalert('No Network Connection');
    return false;
  }
}

$(window).scroll(function() {
  var scroll = $(window).scrollTop() - ($(document).height() - $(window).height());
  if(scroll >= -10 && scroll <= 10) {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      if(window.localStorage.getItem('dairy_full_fetch_'+child_nid) == null) {
        //Fetch only if diary entries are present.
        diaryRetrieve('swipe');
      }
    }
  }
});
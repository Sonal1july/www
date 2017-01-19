var url = window.location.href;
var child_nid = url.split("?")[1];
child_nid = child_nid.split("&")[0];
child_nid = child_nid.split("=")[1];
var child_name =  url.split("&")[1];
child_name = unescape(child_name.split("=")[1]);
var uid='';
window.localStorage.setItem('ft_refresh_'+child_nid,'yes');

document.addEventListener("deviceready", ftOnload, false);

$(document).on('click', '#dashboard_menu li a', function () {
  window.location = $(this).attr('href') +"?child_nid="+child_nid + "&child_name="+child_name;
});

$(document).on('click', '#ft_list li a', function () {
  window.localStorage.setItem('ft_prev_back_pos',$(this).offset().top);
  window.location = "ftentry.html?child_nid="+child_nid +"&ft_id=" +$(this).attr('id');
});

$(window).scroll(function() {
  var scroll = $(window).scrollTop() - ($(document).height() - $(window).height());
  if(scroll >= -10 && scroll <= 10) {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      if(window.localStorage.getItem('ft_full_fetch_'+child_nid) == null) {
        //Fetch only if fee transaction entries are present.
        ftRetrieve('swipe');
      }
    }
  }
});

function ftOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", ftBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(printFtEntries,errorfn,successfn);
}

function ftBackbutton() {
  window.location = "studentdashboard.html?child_nid="+child_nid+"&child_name="+child_name;
}

function ftRefresh() {
  ftRetrieve('refresh');
  ftDelete();
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

function printFtEntries(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS FEETRANSACTION(child_nid INT NOT NULL,ft_id INT NOT NULL,title,posted_on,body,attachment,attachment_type,timestamp,PRIMARY KEY(child_nid,ft_id))');
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM FEETRANSACTION WHERE child_nid="' +child_nid+ '" order by timestamp DESC' ,[],printFtSuccess,errorfn);
  tx.executeSql('SELECT max(timestamp) FROM FEETRANSACTION WHERE child_nid="' +child_nid+'"',[],getMaxTimestamp,errorfn);
}

function printFtSuccess(tx,results) {
  var output ="";
  if(results.rows.length > 0) {
    var ft_ids = '';
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      var ft_refresh = window.localStorage.getItem('ft_refresh_'+child_nid);
      var ft_timestamp = window.localStorage.getItem('ft_timestamp_'+child_nid);
      if(ft_refresh == 'yes' && ft_timestamp != null) {
        ftRetrieve('refresh');
      }
    }
    $.mobile.loading('show');
    tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], ft_getStudentbadge, errorfn);
    for(var i=0; i<results.rows.length; i++) {
      ft_ids += results.rows.item(i).ft_id +',';
      var ftResult = "";
      ftResult += '<div class="icon"><img src="images/ft_icon.png"/></div>';
      if(results.rows.item(i).title.length > 25) {
        var ft_title = results.rows.item(i).title.substr(0,25) + '...';
      }
      else {
        var ft_title = results.rows.item(i).title;
      }
      ftResult += '<div class="title">'+ft_title+'</div>';
      if(results.rows.item(i).body != "NULL") {
        var ft_body = unescape(results.rows.item(i).body);
        if(ft_body.length > 120) {
          ft_body = ft_body.substr(0,120) + '...';
        }
        ftResult += '<div class="body list_body">'+ft_body+'</div>';
      }      
      output += '<li><a id="'+results.rows.item(i).ft_id +'" href="#">'+ftResult+'</a></li>';
    }
    window.localStorage.setItem('ft_ids_'+child_nid,ft_ids);
    $("#ft_entries ul").html(output).listview('refresh');
    $.mobile.loading('hide');
    //Scroll to prev read fee transaction position
    var ft_prev_back_pos = Number(window.localStorage.getItem('ft_prev_back_pos'));
    if(ft_prev_back_pos != 0) {
      ft_prev_back_pos = Number(ft_prev_back_pos) - Number(35);
      $.mobile.silentScroll(ft_prev_back_pos);
    }
  }
  else {
    if(window.localStorage.getItem('ft_full_fetch_'+child_nid) == null) {
      var networkState = navigator.connection.type;
      if(networkState != 'none') {
        ftRetrieve('swipe');
      }
    }
    else if(window.localStorage.getItem('ft_full_fetch_'+child_nid) == 'YES') {
      tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], ft_getStudentbadge, errorfn);
      $("#ft_entries").html("<center><b><span style=color:#C60000;margin-top:20px;>No Entries Found</span></b></center>");
      return false;
    }
  }
}

function ft_getStudentbadge(tx,results) {
  if(results.rows.length > 0) {
    var stdbadge = '';
    for(var i=0; i<results.rows.length; i++) {
      stdbadge += '<div class="child">';
      stdbadge += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      stdbadge += '<div class="child_name">'+child_name + "'s Fee Transactions"+'</div>';
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
    window.localStorage.setItem('ft_timestamp_'+child_nid,value);
  });
}

var db = 0;
function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS FEETRANSACTION(child_nid INT NOT NULL,ft_id INT NOT NULL,title,posted_on,body,attachment,attachment_type,timestamp,PRIMARY KEY(child_nid,ft_id))');
  var data = JSON.parse(window.localStorage.getItem('ftobj'));
  $.each(data, function(key, value) {
    if(key != 'ft_count') {
      value.body = escape(value.body);
      tx.executeSql('INSERT OR REPLACE INTO FEETRANSACTION VALUES ("'+value.child_nid+'","'+value.ft_id+'","'+value.title+'","'+value.posted_on+'","'+value.body+'","'+value.attachment+'","'+value.attachment_type+'","'+value.timestamp+'")');
    }
  });
}

function updateDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(handleUpdate,errorfn,successdb);
}

function handleUpdate(tx) {
  tx.executeSql('SELECT * FROM FEETRANSACTION', [], printRecords, errorfn);
}

function printRecords(tx, results) {
  if(results.rows.length > 0) {
    var data = JSON.parse(window.localStorage.getItem('ftobj'));
    $.each(data, function(key, value) {
      if(key != 'count') {
        tx.executeSql('DELETE FROM FEETRANSACTION WHERE ft_id ='+value+' AND child_nid ='+child_nid+'');
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
  storage.setItem('ftobj',JSON.stringify(data));
}

function ftRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    window.localStorage.setItem('ft_prev_back_pos',0);
    if(window.localStorage.getItem('ft_index_'+child_nid) == null) {
      window.localStorage.setItem('ft_index_'+child_nid,0);
    }
    var ft_index = window.localStorage.getItem('ft_index_'+child_nid);
    var ft_timestamp = window.localStorage.getItem('ft_timestamp_'+child_nid);
    if(eventType == 'refresh') {
      var data = {timestamp : ft_timestamp,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
      window.localStorage.setItem('ft_refresh_'+child_nid,'no');
    }
    else if(eventType == 'swipe') {
      var data = {index : ft_index,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    }
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/feetransactions/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        if(data.ft_count == 0 && eventType == 'swipe') {
          window.localStorage.setItem('ft_full_fetch_'+child_nid,'YES');
        }
        storeuserdata(data);
        ft_index = Number(window.localStorage.getItem('ft_index_'+child_nid)) + Number(data.ft_count);
        window.localStorage.setItem('ft_index_'+child_nid,ft_index);
        createDB();
        ftOnload();
      },
      error:function(error,textStatus,errorThrown) {
    	coolgalert("Unable to Fetch Fee Transaction Entries");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none' && eventType == 'refresh') {
    coolgalert('No Network Connection');
    return false;
  }
}

function ftDelete(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var ft_ids = window.localStorage.getItem('ft_ids_'+child_nid);
    var data = {check_entities : ft_ids,username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/entitydelete/'+ uid + '/' +child_nid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        storeuserdata(data);
        ft_index = Number(window.localStorage.getItem('ft_index_'+child_nid)) - Number(data.count);
        window.localStorage.setItem('ft_index_'+child_nid,ft_index);
        updateDB();
        ftOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Fee Transaction Entries");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
  }
}
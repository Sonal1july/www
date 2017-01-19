var db = 0;
var notify = 0;
document.addEventListener("deviceready", dashboardOnload, false);
function dashboardOnload() {
  document.addEventListener("backbutton", dashboardBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(getChilds,errorfn,successfn);
  notify = window.openDatabase("NotificationDB","1.0","NotificationDB",200000);
  notify.transaction(getNotificationCountByChild,errorfn,successfn);
}

function getNotificationCount() {
  ndb = window.openDatabase("NotificationDB","1.0","NOTIFICATION DATABASE",200000);
  ndb.transaction(getNotificationCountByChild,errorfn,successfn);
}

function dashboardBackbutton() {
  navigator.app.exitApp();
}

function checkConnection() {
  var networkState = navigator.connection.type;
  if(networkState == 'none') {
    $('#offline').show();
  }
  else {
    $('#offline').hide();
    android_devicereg();
  }
}

function getChilds(tx) {
  //we get into this page only if user has children
  //so get user children directly
  tx.executeSql('SELECT * FROM CHILDS', [], printChilds, errorfn);
}

function getNotificationCountByChild(tx) {
  tx.executeSql('SELECT child_nid,messagecount FROM NOTIFICATION', [], printNotificationCountByChild, errorfn);
}

function printNotificationCountByChild(tx, results) {
  if(results.rows.length > 0) {
    var child_not_count = [];
    for(var i=0; i<results.rows.length; i++) {
       if(child_not_count[results.rows.item(i).child_nid] >= 0) {
         child_not_count[results.rows.item(i).child_nid] += Number(results.rows.item(i).messagecount);
       } else {
         child_not_count[results.rows.item(i).child_nid] = Number(results.rows.item(i).messagecount);
       }
       window.localStorage.setItem('coolg_notification_child_'+results.rows.item(i).child_nid,child_not_count[results.rows.item(i).child_nid]);
     }
  }
}

function printChilds(tx, results) {
  if(results.rows.length > 0) {
    var output = '';
    $.mobile.loading('show');
    for(var i=0; i<results.rows.length; i++) {
      var networkState = navigator.connection.type;
      if(networkState != 'none') {
        setstatus(results.rows.item(i).nid);
      }
      output += '<li><a id="'+results.rows.item(i).nid+'" data-studentname="'+results.rows.item(i).name+'" href="#"><div class="child">';
      output += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      output += '<div class="child_name">'+results.rows.item(i).name+'</div>';
      var child_not_count = window.localStorage.getItem('coolg_notification_child_'+results.rows.item(i).nid);
      if(child_not_count > 0) {
        output += '<div class="child_not_count"><span>'+child_not_count+'</span></div>';
      }
      output += '<div class="child_class">'+results.rows.item(i).class+'</div>';
      output += '<div class="child_schoolname">'+results.rows.item(i).schoolname+'</div>';
      output += '</div></a></li>';
    }
    $("#parent_childs ul").append(output).listview('refresh');
    $.mobile.loading('hide');
    $('.child_photo').error(function () {
      $(this).attr('src', 'images/default_user.gif');
    });
  }
  else {
    window.location = 'index.html';
  }
}

function setstatus(child_nid) {
  var data = {username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
  var user = JSON.parse(window.localStorage.getItem("userobj"));
  $.ajax({
    type: 'GET',
    url: coolgmapp_settings_app_site_url+ '/coolgmapp/mobile_app_status/'+user.uid+'/'+child_nid,
    data: data,
    contentType: 'application/json',
    dataType: 'jsonp',
    crossDomain: true,
    beforeSend : function() {$.mobile.loading('show')},
    complete   : function() {$.mobile.loading('hide')},
    success:function(data) {
      window.localStorage.setItem('mobile_app_active_'+child_nid,data);
    },
    error:function(error,textStatus,errorThrown) {
      console.log(errorThrown);
    }
  });
}

function errorfn(err) {
  console.log("Error in SQL:" + err.code);
}

function successfn() {
  console.log("Connected to Database successfully");
}

$(document).on('click', '#children_list li a', function () {
  if(window.localStorage.getItem('mobile_app_active_'+$(this).attr('id')) == 'No') {
    coolgalert("Please Contact school to get it activated");
    return false;
  }
  else {
    window.location = "studentdashboard.html?child_nid="+$(this).attr('id')+"&child_name="+$(this).attr('data-studentname');
  }
});


function android_devicereg() {
  try {
    var pushNotification = window.plugins.pushNotification;
    if(device.platform == 'android' || device.platform == 'Android') {
      pushNotification.register(successHandler, errorHandler, {"senderID":"892175781294","ecb":"onNotificationGCM"});
    }
  }
  catch(err) {
    console.log(err.message);
  }
}

//Handle GCM notifications for Android.
function onNotificationGCM(e) {
  var data = '';
  if((e.event == "registered") && (e.regid.length > 0)) {
    data = JSON.parse(window.localStorage.getItem("userobj"));
    window.localStorage.setItem('gcm_regid',e.regid);
    $.ajax({
      type: "GET",
      url: coolgmapp_settings_app_site_url + "/coolgmapp/device_registration/"+data.uid+"/"+e.regid,
      contentType: "application/json",
      dataType: "jsonp",
      crossDomain: true,
      success:function(data) {
        console.log(data);
      },
      error:function(error,textStatus,errorThrown) {
        console.log(errorThrown);
      }
    });
  }
}

function successHandler(result) {
  console.log('Success: '+result);
}

function errorHandler(error) {
  console.log('Error: '+error);
}
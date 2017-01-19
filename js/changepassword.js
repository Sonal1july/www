document.addEventListener("deviceready", changepasswordOnLoad, false);
var uid = '';

function changepasswordOnLoad() {
  document.addEventListener("backbutton", cpBackbutton, false);
  setTimeout(checkConnection(),10000);
  $('#currentpassword').on('keyup', function(e) {
     var theEvent = e || window.event;
     var keyPressed = theEvent.keyCode || theEvent.which;
     if(keyPressed == 13) {
       $('#newpassword').focus();
     }
     return true;
  });
  $('#newpassword').on('keyup', function(e) {
     var theEvent = e || window.event;
     var keyPressed = theEvent.keyCode || theEvent.which;
     if(keyPressed == 13) {
       $('#confirmnewpassword').focus();
     }
     return true;
  });
  $('#confirmnewpassword').on('keyup', function(e) {
     var theEvent = e || window.event;
     var keyPressed = theEvent.keyCode || theEvent.which;
     if(keyPressed == 13) {
       changePassword();
     }
     return true;
  });
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(getUid,errorfn,successfn);
}

function getUid(tx) {
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
}

function getuidSuccess(tx,results) {
  uid = results.rows.item(0).uid ;
}

function successfn() {
  console.log('Retreival success');
}

function errorfn(err) {
  console.log("Error processing SQL:" + err.code);
}

function cpBackbutton() {
  navigator.app.exitApp();
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

$(document).on("pageinit",function() {
  $(document).on("swiperight",function(e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    $("#slidemenu").panel("open");
  });
  $(document).on("swipeleft",function(e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    $("#slidemenu").panel("close");
  });
});

function coolgalert(msg) {
  $("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><h5>"+msg+"</h5></div>")
  .css({ display: "block",
    opacity: 0.90,
    position: "fixed",
    padding: "4px",
    "text-align": "center",
    width: "270px",
    left: ($(window).width() - 284)/2,
    top: $(window).height()/4 })
  .appendTo($.mobile.pageContainer ).delay(1500)
  .fadeOut(1500, function(){
    $(this).remove();
  });
}

function changePassword() {
  var currentpassword = $('#currentpassword').val();
  var newpassword = $('#newpassword').val();
  var confirmnewpassword = $('#confirmnewpassword').val();
  if(currentpassword == '') {
    coolgalert('Please Enter Current Password');
    $('#currentpassword').focus();
    return false;
  }
  if(newpassword == '') {
    coolgalert('Please Enter New Password');
    $('#newpassword').focus();
    return false;
  }
  if(confirmnewpassword == '') {
    coolgalert('Please Confirm New Password');
    $('#confirmnewpassword').focus();
    return false;
  }
  if(newpassword != confirmnewpassword) {
    coolgalert('New Password and Confirm Password should be same');
    $('#newpassword').focus();
    return false;
  }
  var user_current_password = window.localStorage.getItem('user_password')
  if(user_current_password != currentpassword) {
    coolgalert('Current Password is Incorrect');
    $('#currentpassword').focus();
    return false;
  }
  if(currentpassword == newpassword) {
    coolgalert('New Password should not be same as Current Password');
    $('#newpassword').focus();
    return false;
  }
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var data = {newpassword : $('#confirmnewpassword').val(),username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    alert(uid);
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url+ '/coolgmapp/changepassword/'+ uid,
      data: data,
      contentType: 'application/json',
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
         window.localStorage.clear();
         db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
         db.transaction(dropDB,droperrorfn,dropsuccessfn);
         window.location = "login.html?showmsg=cp";
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to change password");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
  }
}

function dropDB(tx) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {//unregister device in server
    var gcm_regid = window.localStorage.getItem('gcm_regid');
    $.ajax({
      type: "GET",
      url: coolgmapp_settings_app_site_url + "/coolgmapp/device_unregistration/"+gcm_regid,
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
  tx.executeSql('DROP TABLE IF EXISTS ARTICLES');
  tx.executeSql('DROP TABLE IF EXISTS ARTICLE');
  tx.executeSql('DROP TABLE IF EXISTS MEMOIRS');
  tx.executeSql('DROP TABLE IF EXISTS MEMOIR');
  tx.executeSql('DROP TABLE IF EXISTS COMMENT');
  tx.executeSql('DROP TABLE IF EXISTS USER');
  tx.executeSql('DROP TABLE IF EXISTS CHILDS');
  tx.executeSql('DROP TABLE IF EXISTS DIARY');
  tx.executeSql('DROP TABLE IF EXISTS PARENTCOMMENT');
  tx.executeSql('DROP TABLE IF EXISTS CLASSWORK');
  tx.executeSql('DROP TABLE IF EXISTS NOTICE');
  tx.executeSql('DROP TABLE IF EXISTS LEARNINGPLAN');
  tx.executeSql('DROP TABLE IF EXISTS TABSETTINGS');
  tx.executeSql('DROP TABLE IF EXISTS TABSETTINGS_NEW');
  tx.executeSql('DROP TABLE IF EXISTS INSTITUTE_EVENTS');
  tx.executeSql('DROP TABLE IF EXISTS NOTIFICATION');
}

function droperrorfn(err) {
  console.log("Error in logging out" + err.code);
}

function dropsuccessfn() {
  console.log("Database has been dropped successfully");
}
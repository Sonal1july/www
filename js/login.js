document.addEventListener("deviceready", loginOnLoad, false);
var url = window.location.href;
var msg = url.split("?")[1];
if(msg !== undefined) {
  msg = msg.split("=")[1];
}

function loginOnLoad() {
  document.addEventListener("backbutton", loginBackbutton, false);
  setTimeout(checkConnection(),10000);
  $('#username').focus();
  if(msg == 'cp' && msg !== undefined) {
    coolgalert("Your password has been changed successfully. Please Login");
  }
  $('#username').on('keyup', function(e) {
     var theEvent = e || window.event;
     var keyPressed = theEvent.keyCode || theEvent.which;
     if(keyPressed == 13) {
       $('#password').focus();
     }
     return true;
  });
  $('#password').on('keyup', function(e) {
     var theEvent = e || window.event;
     var keyPressed = theEvent.keyCode || theEvent.which;
     if(keyPressed == 13) {
       callLoginSumbit();
     }
     return true;
  });
}

function loginBackbutton() {
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

var db = 0;
function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successfn);
}

function populateDB(tx) {
  tx.executeSql('DROP TABLE IF EXISTS USER');
  tx.executeSql('CREATE TABLE IF NOT EXISTS USER(uid unique,session_id,session_name,username,password,email,role)');
  tx.executeSql('CREATE TABLE IF NOT EXISTS NOTIFICATION(id INTEGER PRIMARY KEY AUTOINCREMENT,not_id INT NOT NULL,category,title,message,child_nid,child_name,messagecount)');
  tx.executeSql('DROP TABLE IF EXISTS CHILDS');
  tx.executeSql('CREATE TABLE IF NOT EXISTS CHILDS(nid unique,name,gender,photo,schoolname,school_profile_cover,class)');
  var data = JSON.parse(window.localStorage.getItem('userobj'));

  tx.executeSql('INSERT INTO USER(uid,session_id,session_name,username,password,email,role) VALUES ("'+data.uid+'","'+data.session_id+'","'+data.session_name+'","'+data.username+'","'+data.password+'","'+data.email+'","'+data.role+'")');
  window.localStorage.setItem('user_name',data.username);
  window.localStorage.setItem('user_password',data.password);
  if(data.childs !== undefined) {
    $.each(data.childs,function(key,value) {
      var childnid = key;
      $.each(value,function(colname,colvalue) {
        if(colname == 'schoolname') {
          window.localStorage.setItem('school_name_'+childnid,colvalue);
        }
        if(colname == 'school_profile_cover') {
          window.localStorage.setItem('school_brand_image_url_'+childnid,colvalue);
        }
        if(colname == 'nid') {
          window.localStorage.setItem('user_parent',1);
          tx.executeSql('INSERT INTO CHILDS('+colname+') VALUES ("'+colvalue+'")');
        }
        else if(colname != 'nid') {
          tx.executeSql('UPDATE CHILDS SET '+colname+' = "'+colvalue+'" where nid = "'+childnid+'"');
        }
      });
    });
  }
  var user_loggedin = window.localStorage.getItem('user_loggedin');
  var user_parent = window.localStorage.getItem('user_parent');
  if(user_loggedin == 1 && user_parent == 1) {
    var data = JSON.parse(window.localStorage.getItem('userobj'));
    if(data.childs !== undefined && Object.keys(data.childs).length > 1) {
      window.location = "dashboard.html";
    }
    else if(data.childs !== undefined &&  Object.keys(data.childs).length == 1) {
      var child_nid;
      var child_name;
       $.each(data.childs,function(key,value) {
         child_nid = value.nid;
         child_name = value.name;
       });
      window.location = "studentdashboard.html?child_nid="+child_nid+"&child_name="+child_name;
    }
  }
  else {
    window.location = "articles.html";
  }
}

function errorfn(err) {
  console.log("Error processing SQL:" + err.code);
}

function successfn() {
  console.log("Database has been created successfully");
}

function storeuserdata(data) {
  var storage = window.localStorage;
  storage.setItem('userobj',JSON.stringify(data));
  window.localStorage.setItem('user_loggedin',1);
}

function callLoginSumbit() {
  var uname = $('#username').val();
  var pass = $('#password').val();
  if(uname == '') {
    coolgalert('Please Enter Username');
    $('#username').focus();
    return false;
  }
  if(pass == '') {
    coolgalert('Please Enter Password');
    $('#password').focus();
    return false;
  }
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_app_site_url + '/coolgmapp/user/login/'+uname+'/'+pass,
      contentType: "application/json",
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        if(data.status == 'success') {
          storeuserdata(data);
          createDB();
        }
        else if(data.status == 'failure') {
          coolgalert('Invalid Username or Password');
          $.mobile.loading('hide');
          $('#username').focus();
          $('#password').val("");
        }
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Login");
        $.mobile.loading('hide');
        userLogoutwithoutRedirect(); //Safety Call Clear LocalStorage and Drop Tables if any
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
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
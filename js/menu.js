var user_loggedin = window.localStorage.getItem('user_loggedin');
var user_parent = window.localStorage.getItem('user_parent');

var db = 0;
var notify = 0;
function getdashboardMenu() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(getChildsformenu,errorfn,successfn);
  notify = window.openDatabase("NotificationDB","1.0","NotificationDB",200000);
  notify.transaction(getNotificationCountByChildformenu,errorfn,successfn);
}

function getChildsformenu(tx) {
  tx.executeSql('SELECT * FROM CHILDS', [], genearteChildlinks, errorfn);
}

function getNotificationCountByChildformenu(tx) {
  tx.executeSql('SELECT child_nid,messagecount FROM NOTIFICATION', [], printNotificationCountByChildformenu, errorfn);
}

function printNotificationCountByChildformenu(tx, results) {
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

function genearteChildlinks(tx, results) {
  if(results.rows.length > 0) {
    var usermenu = '';
    var url = window.location.href;
    var url_split = url.split("/");
    var filename = url_split[url_split.length - 1];
    var child_nid = url.split("?")[1];
    if(child_nid !== undefined) {
      child_nid = child_nid.split("&")[0];
      child_nid = child_nid.split("=")[1];
    }
    //Store Children Count
    window.localStorage.setItem('children_count', results.rows.length);
    //Articles Link
    if(filename !== undefined && filename == 'articles.html') {
      usermenu += '<li class="active" id="articles" data-icon="false" data-theme="e">';
      usermenu += '<a href="articles.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_articles.png"/>';
      usermenu += '<div class="menutitle">Articles</div>';
      usermenu += '</div></a></li>';
    }
    else if(filename !== undefined && filename == 'articleentry.html?article_nid='+child_nid) {
      usermenu += '<li class="active" id="articles" data-icon="false" data-theme="e">';
      usermenu += '<a href="articles.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_articles.png"/>';
      usermenu += '<div class="menutitle">Articles</div>';
      usermenu += '</div></a></li>';
    }
    else {
      usermenu += '<li id="articles" data-icon="false">';
      usermenu += '<a href="articles.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_articles.png"/>';
      usermenu += '<div class="menutitle">Articles</div>';
      usermenu += '</div></a></li>';
    }
    //Memoirs Link
    if(filename !== undefined && filename == 'memoirs.html') {
      usermenu += '<li class="active" id="memoirs" data-theme="e" data-icon="false">';
      usermenu += '<a href="memoirs.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_memoirs.png"/>';
      usermenu += '<div class="menutitle">Memoirs</div>';
      usermenu += '</div></a></li>';
    }
    else if(filename !== undefined && filename == 'memoirentry.html?memoir_nid='+child_nid) {
      usermenu += '<li class="active" id="memoirs" data-theme="e" data-icon="false">';
      usermenu += '<a href="memoirs.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_memoirs.png"/>';
      usermenu += '<div class="menutitle">Memoirs</div>';
      usermenu += '</div></a></li>';
    }
    else {
      usermenu += '<li id="memoirs" data-icon="false">';
      usermenu += '<a href="memoirs.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_memoirs.png"/>';
      usermenu += '<div class="menutitle">Memoirs</div>';
      usermenu += '</div></a></li>';
    }
    //Student Dashboard Links
    var child_name =  url.split("&")[1];
    if(child_name !== undefined) {
      child_name = unescape(child_name.split("=")[1]);
    }
    for(var i=0; i<results.rows.length; i++) {
      if((child_nid !== undefined) && (results.rows.item(i).nid == child_nid)) {
        usermenu += '<li id="std_dashboard_menu" class="active" data-icon="false" data-theme="e">';
      }
      else {
        usermenu += '<li id="std_dashboard_menu" data-icon="false">';
      }
      usermenu += '<a id="'+results.rows.item(i).nid+'" data-studentname="'+results.rows.item(i).name+'" href="studentdashboard.html?child_nid='+results.rows.item(i).nid+'&child_name='+results.rows.item(i).name+'" rel="external">';
      usermenu += '<div class="child">';
      usermenu += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      if(results.rows.item(i).name.length > 32) {
        var std_name = results.rows.item(i).name.substr(0,32);
      }
      else {
        var std_name = results.rows.item(i).name;
      }
      usermenu += '<div class="child_name">'+std_name+'</div>';
      var child_not_count = window.localStorage.getItem('coolg_notification_child_'+results.rows.item(i).nid);
      if(child_not_count > 0) {
        usermenu += '<div class="child_not_count"><span>'+child_not_count+'</span></div>';
      }
      usermenu += '<div class="child_class">'+results.rows.item(i).class+'</div>';
      usermenu += '<div class="child_schoolname">'+results.rows.item(i).schoolname+'</div>';
      usermenu += '</div></a></li>';
    }
    //Change Password Link
    if(filename !== undefined && filename == 'changepassword.html') {
      usermenu += '<li class="active" id="changepassword" data-theme="e" data-icon="false">';
      usermenu += '<a href="changepassword.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/cp_icon.png"/>';
      usermenu += '<div class="menutitle">Change Password</div>';
      usermenu += '</div></a></li>';
    }
    else {
      usermenu += '<li id="changepassword" data-icon="false">';
      usermenu += '<a href="changepassword.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/cp_icon.png"/>';
      usermenu += '<div class="menutitle">Change Password</div>';
      usermenu += '</div></a></li>';
    }
    //Logout Link
    usermenu += '<li id="logout" data-icon="false">';
    usermenu += '<a href="#" onclick="userLogout();" rel="external">';
    usermenu += '<div class="menutile">';
    usermenu += '<img src="images/icon_logout.png"/>';
    usermenu += '<div class="menutitle">Logout</div>';
    usermenu += '</div></a></li>';
    $('ul#usermenu').html(usermenu).listview('refresh');
    $('.child_photo').error(function () {
      $(this).attr('src', 'images/default_user.gif');
    });
  }
}

function addUserMenu() {
  if(user_loggedin == 1 && user_parent == 1) {
    getdashboardMenu();
  }
  else if(user_loggedin == 1 && user_parent == null) { //Guest User
    var usermenu = '';
    var url = window.location.href;
    var url_split = url.split("/");
    var filename = url_split[url_split.length - 1];
    var nid = url.split("?")[1];
    if(nid !== undefined) {
      nid = nid.split("&")[0];
      nid = nid.split("=")[1];
    }
    //Articles Link
    if(filename !== undefined && filename == 'articles.html') {
      usermenu += '<li class="active" id="articles" data-icon="false" data-theme="e">';
      usermenu += '<a href="articles.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_articles.png"/>';
      usermenu += '<div class="menutitle">Articles</div>';
      usermenu += '</div></a></li>';
    }
    else if(filename !== undefined && filename == 'articleentry.html?article_nid='+nid) {
      usermenu += '<li class="active" id="articles" data-icon="false" data-theme="e">';
      usermenu += '<a href="articles.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_articles.png"/>';
      usermenu += '<div class="menutitle">Articles</div>';
      usermenu += '</div></a></li>';
    }
    else {
      usermenu += '<li id="articles" data-icon="false">';
      usermenu += '<a href="articles.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_articles.png"/>';
      usermenu += '<div class="menutitle">Articles</div>';
      usermenu += '</div></a></li>';
    }
    //Memoirs Link
    if(filename !== undefined && filename == 'memoirs.html') {
      usermenu += '<li class="active" id="memoirs" data-theme="e" data-icon="false">';
      usermenu += '<a href="memoirs.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_memoirs.png"/>';
      usermenu += '<div class="menutitle">Memoirs</div>';
      usermenu += '</div></a></li>';
    }
    else if(filename !== undefined && filename == 'memoirentry.html?memoir_nid='+nid) {
      usermenu += '<li class="active" id="memoirs" data-theme="e" data-icon="false">';
      usermenu += '<a href="memoirs.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_memoirs.png"/>';
      usermenu += '<div class="menutitle">Memoirs</div>';
      usermenu += '</div></a></li>';
    }
    else {
      usermenu += '<li id="memoirs" data-icon="false">';
      usermenu += '<a href="memoirs.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_memoirs.png"/>';
      usermenu += '<div class="menutitle">Memoirs</div>';
      usermenu += '</div></a></li>';
    }
    //Change Password Link
    if(filename !== undefined && filename == 'changepassword.html') {
      usermenu += '<li class="active" id="changepassword" data-theme="e" data-icon="false">';
      usermenu += '<a href="changepassword.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_login.png"/>';
      usermenu += '<div class="menutitle">Change Password</div>';
      usermenu += '</div></a></li>';
    }
    else {
      usermenu += '<li id="changepassword" data-icon="false">';
      usermenu += '<a href="changepassword.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_login.png"/>';
      usermenu += '<div class="menutitle">Change Password</div>';
      usermenu += '</div></a></li>';
    }
    //Logout Link
    usermenu += '<li id="logout" data-icon="false">';
    usermenu += '<a href="#" onclick="userLogout();" rel="external">';
    usermenu += '<div class="menutile">';
    usermenu += '<img src="images/icon_logout.png"/>';
    usermenu += '<div class="menutitle">Logout</div>';
    usermenu += '</div></a></li>';
    $('ul#usermenu').html(usermenu).listview('refresh');
  }
  else { //Anonymous User
    var usermenu = '';
    var url = window.location.href;
    var url_split = url.split("/");
    var filename = url_split[url_split.length - 1];
    var child_nid = url.split("?")[1];
    if(child_nid !== undefined) {
      child_nid = child_nid.split("&")[0];
      child_nid = child_nid.split("=")[1];
    }
    if(filename !== undefined && filename == 'articles.html') {
      usermenu += '<li class="active" id="articles" data-icon="false" data-theme="e">';
      usermenu += '<a href="articles.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_articles.png"/>';
      usermenu += '<div class="menutitle">Articles</div>';
      usermenu += '</div></a></li>';
    }
    else if(filename !== undefined && filename == 'articleentry.html?article_nid='+child_nid) {
      usermenu += '<li class="active" id="articles" data-icon="false" data-theme="e">';
      usermenu += '<a href="articles.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_articles.png"/>';
      usermenu += '<div class="menutitle">Articles</div>';
      usermenu += '</div></a></li>';
    }
    else {
      usermenu += '<li id="articles" data-icon="false">';
      usermenu += '<a href="articles.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_articles.png"/>';
      usermenu += '<div class="menutitle">Articles</div>';
      usermenu += '</div></a></li>';
    }
    if(filename !== undefined && filename == 'memoirs.html') {
      usermenu += '<li class="active" id="memoirs" data-theme="e" data-icon="false">';
      usermenu += '<a href="memoirs.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_memoirs.png"/>';
      usermenu += '<div class="menutitle">Memoirs</div>';
      usermenu += '</div></a></li>';
    }
    else if(filename !== undefined && filename == 'memoirentry.html?memoir_nid='+child_nid) {
      usermenu += '<li class="active" id="memoirs" data-theme="e" data-icon="false">';
      usermenu += '<a href="memoirs.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_memoirs.png"/>';
      usermenu += '<div class="menutitle">Memoirs</div>';
      usermenu += '</div></a></li>';
    }
    else {
      usermenu += '<li id="memoirs" data-icon="false">';
      usermenu += '<a href="memoirs.html" rel="external">';
      usermenu += '<div class="menutile">';
      usermenu += '<img src="images/icon_memoirs.png"/>';
      usermenu += '<div class="menutitle">Memoirs</div>';
      usermenu += '</div></a></li>';
    }
    usermenu += '<li id="login" data-icon="false">';
    usermenu += '<a href="login.html" rel="external">';
    usermenu += '<div class="menutile">';
    usermenu += '<img src="images/icon_login.png"/>';
    usermenu += '<div class="menutitle">Login</div>';
    usermenu += '</div></a></li>';
    $('ul#usermenu').html(usermenu).listview('refresh');
  }
  var children_count = window.localStorage.getItem('children_count');
  if(children_count == null && filename != undefined && filename != 'dashboard.html') {
    $('#poweredbybottom').html('<center><a id="opencoolgeducontact" href="#"><span>Powered by</span><img src="images/logo.png" width="100px" title="coolgurukul"/></a></center>');
  }
  else if(children_count != null && children_count <= 2  && screen.height >= 960) {
    $('#poweredbybottom').html('<center><a id="opencoolgeducontact" href="#"><span>Powered by</span><img src="images/logo.png" width="100px" title="coolgurukul"/></a></center>');
  }
  else {
     $('#poweredby').html('<center><a id="opencoolgeducontact" href="#"><span>Powered by</span><img src="images/logo.png" width="100px" title="coolgurukul"/></a></center>');
  }
  $("#slidemenu").trigger("updatelayout");
}

function errorfn(err) {
  console.log("Error in SQL:" + err.code);
}

function successfn() {
  console.log("Connected to Database successfully");
}

$(document).on("pageinit",function() {
  $(document).on("swiperight",function(e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    $("#slidemenu").panel("open");
    addUserMenu();
  });
  $(document).on("swipeleft",function(e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    $("#slidemenu").panel("close");
  });
});

function userLogout() {
  window.localStorage.clear();
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(dropDB,droperrorfn,dropsuccessfn);
  window.location = "articles.html";
}

function userLogoutwithoutRedirect() {
  window.localStorage.clear();
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(dropDB,droperrorfn,dropsuccessfn);
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

function coolgpopup(msg) {
  var content = '<div id="coolgpopup" class="ui-loader ui-overlay-shadow ui-body-e ui-corner-all">';
  content += '<a href="#" id="popup_close_btn"><img src="images/close_icon.png"/></a>';
  content += msg;
  content += '</div>';
  $(content).css({ display: "block",
    opacity: 0.90,
    position: "fixed",
    padding: "6px",
    width: "270px",
    left: ($(window).width() - 284)/2,
    top: $(window).height()/4 })
  .appendTo($.mobile.pageContainer ).delay(1000);
}

$(document).on('click', 'a#popup_close_btn', function () {
  $("#coolgpopup").remove();
});

$(document).on('click', '#opencoolgeducontact', function () {
  window.open("http://www.coolgedu.com/contact","_system");
});

$(document).on('click', '#std_dashboard_menu a', function () {
  if(window.localStorage.getItem('mobile_app_active_'+$(this).attr('id')) == 'No') {
    $("#slidemenu").panel("close");
    coolgalert("Please Contact school to get it activated");
    return false;
  }
});
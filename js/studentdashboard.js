var url = window.location.href;
var url_split = url.split("/");
var filename = url_split[url_split.length - 1];
var child_nid = url.split("?")[1];
child_nid = child_nid.split("&")[0];
child_nid = child_nid.split("=")[1];
var child_name =  url.split("&")[1];
child_name = unescape(child_name.split("=")[1]);
var uid = '';

document.addEventListener("deviceReady",studentdashboardOnload, false);
var db = 0;
var notify = 0;
function studentdashboardOnload() {
  var school_name = window.localStorage.getItem('school_name_'+child_nid);
  $('#school_name').html(school_name);
  document.addEventListener("backbutton", studentdashboardBackbutton, false);
  setTimeout(checkConnection(),10000);
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(showTabSettings,errorfn,successfn);
  notify = window.openDatabase("NotificationDB","1.0","NotificationDB",200000);
  notify.transaction(getNotificationCountByTab,errorfn,successfn);
}

function studentdashboardBackbutton() {
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

function getNotificationCountByTab(tx) {
  tx.executeSql('SELECT child_nid,category,messagecount FROM NOTIFICATION', [], printNotificationCountByTab, errorfn);
}

function printNotificationCountByTab(tx, results) {
  if(results.rows.length > 0) {
    var cat_not_count = [];
    for(var i=0; i<results.rows.length; i++) {
      if(results.rows.item(i).child_nid == child_nid) {
        if(cat_not_count[child_nid+"_"+results.rows.item(i).category] >= 0) {
          cat_not_count[child_nid+"_"+results.rows.item(i).category] += Number(results.rows.item(i).messagecount);
        } else {
          cat_not_count[child_nid+"_"+results.rows.item(i).category] = Number(results.rows.item(i).messagecount);
        }
        window.localStorage.setItem('coolg_notification_'+results.rows.item(i).category+'_'+child_nid,cat_not_count[child_nid+"_"+results.rows.item(i).category]);
      }
    }
  }
}

function showTabSettings(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS TABSETTINGS_NEW(sno INT NOT NULL,child_nid INT NOT NULL,tab_name,tab_value,custom_tab_name,tab_order,PRIMARY KEY(sno,child_nid))');
  tx.executeSql('SELECT uid FROM USER',[],getuidSuccess,errorfn);
  tx.executeSql('SELECT * FROM TABSETTINGS_NEW WHERE child_nid="' +child_nid+ '" and tab_name=tab_value order by tab_order' ,[],showTabSettingsSuccess,errorfn);
}

function getuidSuccess(tx,results) {
  uid = results.rows.item(0).uid ;
}

function showTabSettingsSuccess(tx,results) {
  if(results.rows.length > 0) {
    var output = '';
    for(var i=0; i<results.rows.length; i++) {
      if(results.rows.item(i).tab_name == 'core_diary_management') {
        output += '<a href="diary.html?child_nid='+child_nid+'&child_name='+child_name+'" rel="external" id="Diary">';
        output += '<li class="diary">';
        var cat_not_count = window.localStorage.getItem('coolg_notification_Diary_'+child_nid);
        var diary_tab_name = 'Diary';
        if(results.rows.item(i).custom_tab_name != "default" && results.rows.item(i).custom_tab_name != "undefined"){
          diary_tab_name = results.rows.item(i).custom_tab_name;
        }
        if(cat_not_count > 0) {
          output += '<div class="cat_not_count"><span>'+cat_not_count+'</span></div>';
        }
        output += '<img src="images/diary_icon.png"/>';
        output += '<span>'+diary_tab_name+'</span>';
        output += '</li></a>';
      }
      if(results.rows.item(i).tab_name == 'core_notice_management') {
        output += '<a href="notice.html?child_nid='+child_nid+'&child_name='+child_name+'" rel="external" id="Notice">';
        output += '<li class="notice">';
        var cat_not_count = window.localStorage.getItem('coolg_notification_Notice_'+child_nid);
        var notice_tab_name = 'Notice';
        if(results.rows.item(i).custom_tab_name != "default" && results.rows.item(i).custom_tab_name != "undefined"){
          notice_tab_name = results.rows.item(i).custom_tab_name;
        }
        if(cat_not_count > 0) {
          output += '<div class="cat_not_count"><span>'+cat_not_count+'</span></div>';
        }
        output += '<img src="images/notice_icon.png"/>';
        output += '<span>'+notice_tab_name+'</span>';
        output += '</li></a>';
      }
      if(results.rows.item(i).tab_name == 'core_institute_events') {
        output += '<a href="calendar.html?child_nid='+child_nid+'&child_name='+child_name+'" rel="external" id="Calender Event">';
        output += '<li class="calendar">';
        var cat_not_count = window.localStorage.getItem('coolg_notification_Calender Event_'+child_nid);
        var events_tab_name = 'Calendar';
        if(results.rows.item(i).custom_tab_name != "default" && results.rows.item(i).custom_tab_name != "undefined"){
          events_tab_name = results.rows.item(i).custom_tab_name;
        }
        if(cat_not_count > 0) {
          output += '<div class="cat_not_count"><span>'+cat_not_count+'</span></div>';
        }
        output += '<img src="images/cal_icon.png"/>';
        output += '<span>'+events_tab_name+'</span>';
        output += '</li></a>';
      }
      if(results.rows.item(i).tab_name == 'core_class_work') {
        output += '<a href="classwork.html?child_nid='+child_nid+'&child_name='+child_name+'" rel="external" id="Class Work">';
        output += '<li class="classwork">';
        var cat_not_count = window.localStorage.getItem('coolg_notification_Class Work_'+child_nid);
        var class_work_tab_name = 'Classwork';
        if(results.rows.item(i).custom_tab_name != "default" && results.rows.item(i).custom_tab_name != "undefined"){
          class_work_tab_name = results.rows.item(i).custom_tab_name;
        }
        if(cat_not_count > 0) {
          output += '<div class="cat_not_count"><span>'+cat_not_count+'</span></div>';
        }
        output += '<img src="images/cw_icon.png"/>';
        output += '<span>'+class_work_tab_name+'</span>';
        output += '</li></a>';
      }
      if(results.rows.item(i).tab_name == 'core_curriculum_management') {
        output += '<a href="learningplan.html?child_nid='+child_nid+'&child_name='+child_name+'" rel="external" id="Learning Plan">';
        output += '<li class="learningplan">';
        var cat_not_count = window.localStorage.getItem('coolg_notification_Learning Plan_'+child_nid);
        var curriculum_management_tab_name = 'Learning plan';
        if(results.rows.item(i).custom_tab_name != "default" && results.rows.item(i).custom_tab_name != "undefined"){
          curriculum_management_tab_name = results.rows.item(i).custom_tab_name;
        }
        if(cat_not_count > 0) {
          output += '<div class="cat_not_count"><span>'+cat_not_count+'</span></div>';
        }
        output += '<img src="images/lp_icon.png"/>';
        output += '<span>'+curriculum_management_tab_name+'</span>';
        output += '</li></a>';
      }
      if(results.rows.item(i).tab_name == 'core_daily_report_sheet') {
        output += '<a href="drs.html?child_nid='+child_nid+'&child_name='+child_name+'" rel="external" id="Daily Report">';
        output += '<li class="drs">';
        var cat_not_count = window.localStorage.getItem('coolg_notification_Daily Report_'+child_nid);
        var daily_report_sheet_tab_name = 'Daily Report';
        if(results.rows.item(i).custom_tab_name != "default" && results.rows.item(i).custom_tab_name != "undefined"){
          daily_report_sheet_tab_name = results.rows.item(i).custom_tab_name;
        }
        if(cat_not_count > 0) {
          output += '<div class="cat_not_count"><span>'+cat_not_count+'</span></div>';
        }
        output += '<img src="images/drs_icon.png"/>';
        output += '<span>'+daily_report_sheet_tab_name+'</span>';
        output += '</li></a>';
      }
      if(results.rows.item(i).tab_name == 'core_time_table') {
        output += '<a href="tt.html?child_nid='+child_nid+'&child_name='+child_name+'" rel="external" id="Time Table">';
        output += '<li class="tt">';
        var cat_not_count = window.localStorage.getItem('coolg_notification_Time_Table_'+child_nid);
        var time_table_tab_name = 'Time Table';
        if(results.rows.item(i).custom_tab_name != "default" && results.rows.item(i).custom_tab_name != "undefined"){
          time_table_tab_name = results.rows.item(i).custom_tab_name;
        }
        if(cat_not_count > 0) {
          output += '<div class="cat_not_count"><span>'+cat_not_count+'</span></div>';
        }
        output += '<img src="images/tt_icon.png"/>';
        output += '<span>'+time_table_tab_name+'</span>';
        output += '</li></a>';
      }      
      if(results.rows.item(i).tab_name == 'core_newsletter') {
        output += '<a href="nl.html?child_nid='+child_nid+'&child_name='+child_name+'" rel="external" id="Newsletter">';
        output += '<li class="nl">';
        var cat_not_count = window.localStorage.getItem('coolg_notification_Newsletter_'+child_nid);
        var newsletter_tab_name = 'Newsletter';
        if(results.rows.item(i).custom_tab_name != "default" && results.rows.item(i).custom_tab_name != "undefined"){
          newsletter_tab_name = results.rows.item(i).custom_tab_name;
        }
        if(cat_not_count > 0) {
          output += '<div class="cat_not_count"><span>'+cat_not_count+'</span></div>';
        }
        output += '<img src="images/nl_icon.png"/>';
        output += '<span>'+newsletter_tab_name+'</span>';
        output += '</li></a>';
      }
      if(results.rows.item(i).tab_name == 'core_institute_program') {
        output += '<a href="fc.html?child_nid='+child_nid+'&child_name='+child_name+'" rel="external" id="Fee Card">';
        output += '<li class="fc">';
        var cat_not_count = window.localStorage.getItem('coolg_notification_Fee_Card_'+child_nid);
        var institute_program_tab_name = 'Fee Card';
        if(results.rows.item(i).custom_tab_name != "default" && results.rows.item(i).custom_tab_name != "undefined"){
          institute_program_tab_name = results.rows.item(i).custom_tab_name;
        }
        if(cat_not_count > 0) {
          output += '<div class="cat_not_count"><span>'+cat_not_count+'</span></div>';
        }
        output += '<img src="images/fc_icon.png"/>';
        output += '<span>'+institute_program_tab_name+'</span>';
        output += '</li></a>';
      }
      if(results.rows.item(i).tab_name == 'core_institute_program') {
        output += '<a href="ft.html?child_nid='+child_nid+'&child_name='+child_name+'" rel="external" id="Fee Transactions">';
        output += '<li class="ft">';
        var cat_not_count = window.localStorage.getItem('coolg_notification_Fee_Transactions_'+child_nid);
        if(cat_not_count > 0) {
          output += '<div class="cat_not_count"><span>'+cat_not_count+'</span></div>';
        }
        output += '<img src="images/ft_icon.png"/>';
        output += '<span>Fee Transactions</span>';
        output += '</li></a>';
      }
      if(results.rows.item(i).tab_name == 'student_profile') {
        var student_profile_tab_name = 'Student Profile';
        if(results.rows.item(i).custom_tab_name != "default" && results.rows.item(i).custom_tab_name != "undefined"){
          student_profile_tab_name = results.rows.item(i).custom_tab_name;
        }
        output += '<a href="sp.html?child_nid='+child_nid+'&child_name='+child_name+'" rel="external" id="Student Profile">';
        output += '<li class="sp">';
        output += '<img src="images/sp_icon.png"/>';
        output += '<span>'+student_profile_tab_name+'</span>';
        output += '</li></a>';
      }      
     if(results.rows.item(i).tab_name == 'core_magical_moments') {
        output += '<a href="mmalbums.html?child_nid='+child_nid+'&child_name='+child_name+'" rel="external" id="Magical Moment">';
        output += '<li class="mmphotos">';
        var magical_moments_tab_name = 'Photos';
        if(results.rows.item(i).custom_tab_name != "default" && results.rows.item(i).custom_tab_name != "undefined"){
          magical_moments_tab_name = results.rows.item(i).custom_tab_name;
        }
        var cat_not_count = window.localStorage.getItem('coolg_notification_Magical Moment_'+child_nid);
        if(cat_not_count > 0) {
        output += '<div class="cat_not_count"><span>'+cat_not_count+'</span></div>';
        }
        output += '<img src="images/photo_icon.png"/>';
        output += '<span>'+magical_moments_tab_name+'</span>';
        output += '</li></a>';
      }
    }
    var school_website = window.localStorage.getItem('school_website_'+child_nid);
    if(school_website !== 'No' && school_website !== undefined && school_website !== null) {
      output += '<a href="#" rel="external" id="SchoolWebsite">';
      output += '<li class="schoolwebsite">';
      output += '<img src="images/web_icon.png"/>';
      output += '<span>School Website</span>';
      output += '</li></a>';
    }
    var school_brand_image_url = window.localStorage.getItem('school_brand_image_url_'+child_nid);
    $('#schoolbrand').show();
    tx.executeSql('SELECT * FROM CHILDS WHERE nid ="'+child_nid+'"', [], getStudentbadge, errorfn);
    $('#schoolbrand').html('<img src="'+school_brand_image_url+'"/>');
    $('ul#student_dashboard').html(output);
  }
  else {
    tabSettingsRetrieve();
  }
}

function getStudentbadge(tx,results) {
  if(results.rows.length > 0) {
    var stdbadge = '';
    for(var i=0; i<results.rows.length; i++) {
      stdbadge += '<div class="child">';
      stdbadge += '<img class="child_photo" src="'+results.rows.item(i).photo+'"/>';
      stdbadge += '<div class="child_name">'+results.rows.item(i).name+'</div>';
      stdbadge += '<div class="child_class">'+results.rows.item(i).class+'</div>';
      stdbadge += '<div class="child_schoolname">'+results.rows.item(i).schoolname+'</div>';
      stdbadge += '</div>';
    }
    $('#studentdashboardbadge').show();
    $('#studentdashboardbadge').html(stdbadge);
  }
}

var db = 0;
function createDB() {
  db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function successdb() {
  console.log("Database has been created successfully");
}

function successfn() {
  console.log("Database has been created successfully");
}

function errorfn(err) {
  console.log("Error processing SQL:" + err.code);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS TABSETTINGS_NEW(sno INT NOT NULL,child_nid INT NOT NULL,tab_name,tab_value,custom_tab_name,tab_order,PRIMARY KEY(sno,child_nid))');
  var data = JSON.parse(window.localStorage.getItem('tabsettingsobj'));
  $.each(data, function(key, value) {
    tx.executeSql('INSERT OR IGNORE INTO TABSETTINGS_NEW(sno,child_nid,tab_name,tab_value,custom_tab_name,tab_order) VALUES ("'+value.sno+'","'+value.child_nid+'","'+value.tab_name+'","'+value.tab_value+'","'+value.custom_tab_name+'","'+value.tab_order+'")');
  });
}

function storeuserdata(data) {
  var storage = window.localStorage;
  storage.setItem('tabsettingsobj',JSON.stringify(data));
}

function tabSettingsRetrieve() {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    var data = {username:window.localStorage.getItem('user_name'),password:window.localStorage.getItem('user_password')};
    $.ajax({
      type: 'POST',
      url: coolgmapp_settings_app_site_url + '/coolgmapp/tabsettings/'+uid+'/'+child_nid,
      data: data,
      contentType: "application/json",
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        storeuserdata(data);
        createDB();
        studentdashboardOnload();
      },
      error:function(error,textStatus,errorThrown) {
        console.log(errorThrown);
      }
    });
    //Get School Website
    $.ajax({
      type: 'POST',
      url: coolgmapp_settings_app_site_url + '/coolgmapp/getschoolwebsite/'+uid+'/'+child_nid,
      data: data,
      contentType: "application/json",
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        window.localStorage.setItem('school_website_'+child_nid,data);
      },
      error:function(error,textStatus,errorThrown) {
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none') {
    coolgalert('No Network Connection');
    return false;
  }
}

$(document).on('click', '#student_dashboard a', function () {
  var category = $(this).attr('id');
  if(category !== 'SchoolWebsite') {
    notify = window.openDatabase("NotificationDB","1.0","NotificationDB",200000);
    notify.transaction(function(tx) { tx.executeSql('DELETE FROM NOTIFICATION where child_nid="'+child_nid+'" AND category="'+category+'"'); }, errorfn);
    window.localStorage.setItem('coolg_notification_'+category+'_'+child_nid,0);
    notify.transaction(function(tx) { tx.executeSql('SELECT * FROM NOTIFICATION WHERE child_nid="'+child_nid+'"', [], checkNotificationCountByChildisZero, errorfn); }, errorfn);
  }
  else if(category == 'SchoolWebsite') {
    var school_website = window.localStorage.getItem('school_website_'+child_nid);
    window.open(school_website,"_system");
  }
});

function checkNotificationCountByChildisZero(tx, results) {
  if(results.rows.length === 0) {
    window.localStorage.setItem('coolg_notification_child_'+child_nid,0);
  }
}
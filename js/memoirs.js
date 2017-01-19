document.addEventListener("deviceready", memoirsOnload, false);

function memoirsOnload() {
  document.addEventListener("backbutton", memoirsBackbutton, false);
  setTimeout(checkConnection(),10000);
  var db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(getMemoirsfromDB,errorfn,successfn);
}

function memoirsBackbutton() {
  if($('input[data-type="search"]').val() == '') {
    navigator.app.exitApp();
  }
  else {
    $('input[data-type="search"]').val('');
    $('input[data-type="search"]').trigger("keyup");
  }
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

function getMemoirsfromDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS MEMOIRS(nid PRIMARY KEY,title,body,posted_on,timestamp)');
  tx.executeSql('SELECT * FROM MEMOIRS ORDER BY timestamp DESC', [], printMemoirs, errorfn);
}

function printMemoirs(tx, results) {
  var title_limit = 35;
  if(results.rows.length > 0) {
    var output = '';
    $.mobile.loading('show');
    for(var i=0; i<results.rows.length; i++) {
      output += '<li><a id="'+results.rows.item(i).nid+'" href="#">';
      output += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
      if(results.rows.item(i).title.length > title_limit) {
        var title = unescape(results.rows.item(i).title).substring(0,title_limit) + '...';
      }
      else {
        var title = unescape(results.rows.item(i).title);
      }
      output += '<div class="title">'+title+'</div>';
      output += '<div class="body">'+unescape(results.rows.item(i).body)+'</div>';
      output += '</a></li>';
    }
    $("#memoirs_entries ul").html(output).listview('refresh');
    $.mobile.loading('hide');
    //Scroll to prev read article position
    var memoir_prev_back_pos = Number(window.localStorage.getItem('memoir_prev_back_pos'));
    if(memoir_prev_back_pos != 0) {
      memoir_prev_back_pos = Number(memoir_prev_back_pos) - Number(35);
      $.mobile.silentScroll(memoir_prev_back_pos);
    }
  }
  else {
    if(window.localStorage.getItem('memoirs_full_fetch') == null) {
      var networkState = navigator.connection.type;
      if(networkState != 'none') {
        memoirsRetrieve('swipe');
      }
    }
    else if(window.localStorage.getItem('memoirs_full_fetch') == 'YES') {
      coolgalert("No Memoirs");
      return false;
    }
  }
}

function errorfn(err) {
  console.log("Error in SQL:" + err.code);
}

function successfn() {
  console.log("Connected to Database successfully");
}

function successdb() {
  console.log("Database has been created successfully");
}

$(document).on('click', '#memoirs_list li a', function () {
  window.localStorage.setItem('memoir_prev_back_pos',$(this).offset().top);
  window.location = "memoirentry.html?memoir_nid="+$(this).attr('id');
});

function storeMemoirs(data) {
  var storage = window.localStorage;
  storage.setItem('memoirs',JSON.stringify(data));
}

function createDB() {
  var db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS MEMOIRS(nid PRIMARY KEY,title,body,posted_on,timestamp)');
  var data = JSON.parse(window.localStorage.getItem('memoirs'));
  $.each(data, function(key, value) {
    if(key != 'count') {
      value.title = escape(value.title);
      value.body = escape(value.body);
      tx.executeSql('INSERT OR IGNORE INTO MEMOIRS(nid,title,body,posted_on,timestamp) VALUES ("'+value.nid+'","'+value.title+'","'+value.body+'","'+value.posted_on+'","'+value.timestamp+'")');
    }
  });
  tx.executeSql('SELECT max(timestamp) FROM MEMOIRS', [], setmaxMemoirTimestamp, errorfn);
}

function setmaxMemoirTimestamp(tx,results) {
  if(results.rows.length > 0) {
    $.each(results.rows.item(0),function(k,v) {
      window.localStorage.setItem('memoir_timestamp','v');
    });
  }
}

function memoirsRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    window.localStorage.setItem('memoir_prev_back_pos',0);
    if(window.localStorage.getItem('memoir_index') == null || window.localStorage.getItem('memoir_index') == 'NaN') {
      window.localStorage.setItem('memoir_index',0);
    }
    var memoir_index = window.localStorage.getItem('memoir_index');
    var memoir_timestamp = window.localStorage.getItem('memoir_timestamp');
    if(eventType == 'swipe') {
      var data = {index: memoir_index,token:'coolgurukul_mapp'};
    }
    else if(eventType == 'click') {
      var data = {timestamp: memoir_timestamp,token:'coolgurukul_mapp'};
    }
    $.ajax({
      type: 'GET',
      url: coolgmapp_settings_coolg_site_url + '/coolgmapp/memoirs',
      data: data,
      contentType: "application/json",
      dataType: 'jsonp',
      crossDomain: true,
      beforeSend : function() {$.mobile.loading('show')},
      complete   : function() {$.mobile.loading('hide')},
      success:function(data) {
        if(data.count == 0 && eventType == 'swipe') {
          window.localStorage.setItem('memoirs_full_fetch','YES');
        }
        storeMemoirs(data);
        memoir_index = Number(window.localStorage.getItem('memoir_index')) + Number(data.count);
        window.localStorage.setItem('memoir_index',memoir_index);
        createDB();
        memoirsOnload();
      },
      error:function(error,textStatus,errorThrown) {
        coolgalert("Unable to Fetch Memoirs");
        console.log(errorThrown);
      }
    });
  }
  else if(networkState == 'none' && eventType == 'click') {
    coolgalert('No Network Connection');
  }
}

$(window).scroll(function() {
  var scroll = $(window).scrollTop() - ($(document).height() - $(window).height());
  if(scroll >= -10 && scroll <= 10) {
    var networkState = navigator.connection.type;
    if(networkState != 'none') {
      if(window.localStorage.getItem('memoirs_full_fetch') == null) {
        //Fetch only if memoirs are present.
        memoirsRetrieve('swipe');
      }
    }
  }
});
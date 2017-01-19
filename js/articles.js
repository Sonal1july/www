document.addEventListener("deviceready", articlesOnload, false);

function articlesOnload() {
  document.addEventListener("backbutton", articlesBackbutton, false);
  setTimeout(checkConnection(),100);
  var db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(getArticlesfromDB,dberrorfn,successfn);
}

function articlesBackbutton() {
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

function getArticlesfromDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS ARTICLES(nid PRIMARY KEY,title,body,posted_on,image,timestamp)');
  tx.executeSql('SELECT * FROM ARTICLES ORDER BY timestamp DESC', [], printArticles, errorfn);
}

function printArticles(tx, results) {
  var title_limit = 35;
  if(results.rows.length > 0) {
    var output = '';
    $.mobile.loading('show');
    for(var i=0; i<results.rows.length; i++) {
      output += '<li><a id="'+results.rows.item(i).nid+'" href="#">';
      if(results.rows.item(i).title.length > title_limit) {
        var title = results.rows.item(i).title.substr(0,title_limit) + '...';
      }
      else {
        var title = results.rows.item(i).title;
      }
      output += '<div class="posted_on">'+results.rows.item(i).posted_on+'</div>';
      output += '<div class="title">'+title+'</div>';
      output += '<div class="photo"><img src="'+results.rows.item(i).image+'"/></div>';
      output += '<div class="body">'+results.rows.item(i).body+'</div>';
      output += '</a></li>';
    }
    $("#articles_entries ul").html(output).listview('refresh');
    $.mobile.loading('hide');
    //Scroll to prev read article position
    var article_prev_back_pos = Number(window.localStorage.getItem('article_prev_back_pos'));
    if(article_prev_back_pos != 0) {
      article_prev_back_pos = Number(article_prev_back_pos) - Number(35);
      $.mobile.silentScroll(article_prev_back_pos);
    }
  }
  else {
    if(window.localStorage.getItem('articles_full_fetch') == null) {
      var networkState = navigator.connection.type;
      if(networkState != 'none') {
        articlesRetrieve('swipe');
      }
    }
    else if(window.localStorage.getItem('articles_full_fetch') == 'YES') {
      coolgalert("No Articles");
      return false;
    }
  }
}

function errorfn(err) {
  console.log("Error in SQL:" + err.code);
}

function dberrorfn(err) {
  //Logout Clears LocalStorage Variables and Drops Data in Tables if any -- Safety Call
  userLogoutwithoutRedirect();
  window.localStorage.setItem('db_name_changed',1);
  //Dynamic DB Name
  var new_db_timestamp = Math.round((new Date()).getTime() / 1000);
  var coolgmapp_settings_new_db_name =  coolgmapp_settings_db_name + new_db_timestamp;
  window.localStorage.setItem('coolgmapp_settings_new_db_name',coolgmapp_settings_new_db_name);
  location.reload();
}

function successfn() {
  console.log("Connected to Database successfully");
}

function successdb() {
  console.log("Database has been created successfully");
}

$(document).on('click', '#articles_list li a', function () {
  window.localStorage.setItem('article_prev_back_pos',$(this).offset().top);
  window.location = "articleentry.html?article_nid="+$(this).attr('id');
});

function storeArticles(data) {
  var storage = window.localStorage;
  storage.setItem('articles',JSON.stringify(data));
}

function createDB() {
  var db = window.openDatabase(coolgmapp_settings_db_name,"1.0","coolgmapp database",200000);
  db.transaction(populateDB,errorfn,successdb);
}

function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS ARTICLES(nid PRIMARY KEY,title,body,posted_on,image,timestamp)');
  var data = JSON.parse(window.localStorage.getItem('articles'));
  $.each(data, function(key, value) {
    if(key != 'count') {
      tx.executeSql('INSERT OR IGNORE INTO ARTICLES(nid,title,body,posted_on,image,timestamp) VALUES ("'+value.nid+'","'+value.title+'","'+value.body+'","'+value.posted_on+'","'+value.image+'","'+value.timestamp+'")');
    }
  });
  tx.executeSql('SELECT max(timestamp) FROM ARTICLES', [], setmaxArticleTimestamp, errorfn);
}

function setmaxArticleTimestamp(tx,results) {
  if(results.rows.length > 0) {
    $.each(results.rows.item(0),function(k,v) {
      window.localStorage.setItem('article_timestamp','v');
    });
  }
}

function articlesRetrieve(eventType) {
  var networkState = navigator.connection.type;
  if(networkState != 'none') {
    window.localStorage.setItem('article_prev_back_pos',0);
      if(window.localStorage.getItem('article_index') == null || window.localStorage.getItem('article_index') == 'NaN') {
        window.localStorage.setItem('article_index',0);
      }
      var article_index = window.localStorage.getItem('article_index');
      var article_timestamp = window.localStorage.getItem('article_timestamp');
      if(eventType == 'swipe') {
        var data = {index: article_index,token:'coolgurukul_mapp'};
      }
      else if(eventType == 'click') {
        var data = {timestamp: article_timestamp,token:'coolgurukul_mapp'};
      }
      $.ajax({
        type: 'GET',
        url: coolgmapp_settings_coolg_site_url + '/coolgmapp/articles',
        data: data,
        contentType: "application/json",
        dataType: 'jsonp',
        crossDomain: true,
        beforeSend : function() {$.mobile.loading('show')},
        complete   : function() {$.mobile.loading('hide')},
        success:function(data) {
          if(data.count == 0 && eventType == 'swipe') {
            window.localStorage.setItem('articles_full_fetch','YES');
          }
          storeArticles(data);
          article_index = Number(window.localStorage.getItem('article_index')) + Number(data.count);
          window.localStorage.setItem('article_index',article_index);
          createDB();
          articlesOnload();
          },
        error:function(error,textStatus,errorThrown) {
          coolgalert("Unable to Fetch Articles");
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
      if(window.localStorage.getItem('articles_full_fetch') == null) {
        //Fetch only if articles are present.
        articlesRetrieve('swipe');
      }
    }
  }
});
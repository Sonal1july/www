//YOUR_COMMUNITY_URL
var coolgmapp_settings_app_site_url = 'http://app.coolg.in';

//YOUR_COMMUNITY_URL
var coolgmapp_settings_coolg_site_url = 'http://www.coolg.in';

if(window.localStorage.getItem('db_name_changed') == null) {
  window.localStorage.setItem('coolgmapp_settings_db_name','coolgmapp');
}
else if(window.localStorage.getItem('db_name_changed') == 1) {
  coolgmapp_settings_db_name = window.localStorage.getItem('coolgmapp_settings_new_db_name');
  window.localStorage.setItem('coolgmapp_settings_db_name',coolgmapp_settings_db_name);
  window.localStorage.setItem('db_name_changed',0);
}

//YOUR_DATABASE_NAME
var coolgmapp_settings_db_name = window.localStorage.getItem('coolgmapp_settings_db_name');
document.addEventListener("deviceready", indexOnload, false);

function indexOnload() {
  var user_loggedin = window.localStorage.getItem('user_loggedin');
  var user_parent = window.localStorage.getItem('user_parent');
  if(user_loggedin == 1 && user_parent == 1) {
    var data = JSON.parse(window.localStorage.getItem('userobj'));
    if(Object.keys(data.childs).length > 1) {
      window.location = "dashboard.html";
    }
    else if(Object.keys(data.childs).length == 1) {
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
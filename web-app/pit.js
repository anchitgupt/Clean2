var row = "";
var row1 = "";
var row_no;
var da = [
  [],
  []
];
var ga = [
  [],
  []
];

var type = 'pit';
var type_distance = 25;

var sleep = 0;
var latlng = 0;
var i = 0;

var data_json;
var data_list;

var citymap = [];

$("#signOutBtn").click(
  function() {
    firebase.auth().signOut().then(function() {
      window.location.replace("index.html");
      $('#analysisPortion').hide();
      // Sign-out successful.
    }).catch(function(error) {
      // An error happened.
      alert(error.message);
    });
  }
);
$('#statsBtn').click(function(){
  window.location.replace("pit_chart.html");
});

function init() {
  // body...
  $('#analysisPortion').hide();
  $("#oldHistory").hide();
  $("#issue").show();
  $(".login-cover").hide();
  var database = firebase.database();
  var issuesList = database.ref(type).child('new');
  issuesList.orderByChild('time').on('value', gotData, errorData);
}
///Analysis
function analysis() {

  console.log("Analysis Called");
  var database = firebase.database();
  var anaList = database.ref(type + '/group_data');
  anaList.on('value', anaData, errorData);
}

function anaData(data) {

  var json_group = data.val();
  getnewData();

  if (json_group == null && data_json[data_list[0]].group == "no") {
    console.log("Empty");
    createEntry();
    analysis();
  } else if(json_group!=null){

    console.log(json_group);
    //some group_data is present this returns the length
    var len = data_list.length;

    // Return The latlng key ehich is created in the group_data
    var keys_source_latlng_list = Object.keys(data.val());
    console.log("Count: " + keys_source_latlng_list.length);

    var source_length = keys_source_latlng_list.length;
    //returns list of all keys of latlng created
    console.log("Group Data List: " + keys_source_latlng_list);
    //some group_data is present this returns the length
    console.log("Group Data Length: " + source_length);

    //loop Initialize
    var k = 0;
    var flag = 0;

    while (k < len) {
      //getting the data from the pit->new->{{kth index}}
      var single_list_data = data_json[data_list[k]];
      flag = 0;
      if (single_list_data.group == "no") {

        console.log("Data: " + single_list_data.key + " " + single_list_data.desc);

        var dest = single_list_data.latlng;

        var dest_lat = getLat(dest);
        var dest_lng = getLng(dest);

          for (i = 0; i < source_length; i++) {
          if (single_list_data.group == "no") {

            //iterating in pit --> group_data
            var index_latlng = latlngOrignal(keys_source_latlng_list[i]);
            var group_data_current_key = keys_source_latlng_list[i];
            //  console.log("keysjsdjasjnjkxasjkhdjsh"+keys_source_latlng_list[i]);
            console.log("Index: " + index_latlng);

            var source_lng = getLng(index_latlng);
            console.log("Source Longitude: " + source_lng);

            var source_lat = getLat(index_latlng);
            console.log("Source Latitude: " + source_lat);

            console.log("Destination: Latitude: " + dest_lat);
            console.log("Destination: Longitude: " + dest_lng);

            var from = turf.point([source_lat, source_lng]);
            var to = turf.point([dest_lat, dest_lng]);

            var distance = turf.distance(from, to);
            distance = distance * 1000; //metres
            console.log("Distance: " + distance);

            //distance if less than l

            if (distance < type_distance) {

              var count = json_group[keys_source_latlng_list[i]].count;
              var keys = json_group[keys_source_latlng_list[i]].keys;

              makeGroupNo(single_list_data.key);

              console.log("Count: " + count);
              console.log("Keys: " + keys);

              count = count + 1;
              keys = keys + ";" + single_list_data.key;

              console.log("Count Updated: " + count);
              console.log("Keys Updated: " + keys);
              console.log(keys_source_latlng_list[i]);

              updateGroupData(group_data_current_key, count, keys);

              flag = 1;
              continue;

            }else if (i == source_length-1) {
              makeNewGroup(single_list_data.key, single_list_data.latlng);
              makeGroupNo(single_list_data.key);
            }
          }
          /* else { // distance is greater than the given value
                      makeNewGroup(single_list_data.key, single_list_data.latlng);
                      makeGroupNo(single_list_data.key);
                    } // end distance
                    */
        }//end for

      }
      k++;
      console.log("LOOP : Incremented: " + k);
    } // end while

  } //end else
  initMap();
} //end function

function getnewData() {
  var data;
  firebase.database().ref(type + "/new").on('value', function(cdata) {
    data = cdata.val();
  }, errorData);
  data_json = data;
  data_list = Object.keys(data_json);
}

function makeNewGroup(key, latlng) {
  latlng = latlng.split(".").join("");
  firebase.database().ref(type + '/group_data/' + latlng).set({
    count: 1,
    keys: key
  }, console.log("Group Created"));
}

function updateGroupData(k, count, keys) {
  firebase.database().ref(type + '/group_data/' + k).update({
    count: count,
    keys: keys
  }, console.log("Group data Updated"));
}

function turfCenter() {
  var features = turf.featureCollection([
    turf.point([-97.522259, 35.4691]),
    turf.point([-97.502754, 35.463455]),
  ]);
  var center = turf.center(features);
  console.log(center.geometry.coordinates);
}

function makeGroupNo(key) {
  firebase.database().ref(type + '/new/' + key).update({
    group: "yes"
  }, console.log("Group Updated from The No to Yes"));
}


function latlngOrignal(latlng) {
  var lat = latlng.split(";")[0];
  var lng = latlng.split(";")[1];

  var res = lat.slice(0, 2);
  var res2 = lat.slice(2, -1);
  lat = res + "." + res2;

  res = lng.slice(0, 2);
  res2 = lng.slice(2, -1);
  lng = res + "." + res2;

  return lat + ";" + lng;
}

function getLat(latlng) {
  return latlng.split(";")[0];
}


function getLng(latlng) {
  return latlng.split(";")[1];
}


function createEntry() {
  var single_list_data = data_json[data_list[0]];
  var database = firebase.database();
  if(single_list_data.group == "no"){
  var refGroup = database.ref(type + '/group_data/' + single_list_data.latlng.split(".").join("")).set({
    count: 1,
    keys: single_list_data.key
  }, console.log("Data Created"));

  firebase.database().ref(type + '/new/' + single_list_data.key).update({
    group: "yes"
  }, console.log("Data Group Updated"));

  }
  else {
    console.log("NO DATA TO BE MADE LATLNGGROUP");
    return;
  }

}

///Analysis

//table filling
function gotData(data) {
  //console.log(data.val());
  var h = data.val();
  if (h == null) {
    console.log("emptyyyyyyyyyyyyyyyyyyyyyyyy");
    document.getElementById('issue')
      .innerHTML = "<h1>No Data</h1>";
  } else {
    var keys = Object.keys(data.val());

    //gives the json
    console.log(h);
    data_json = h;
    //gives the list array of the headers
    console.log(keys);
    data_list = keys;

    //getting the first position of the list

    row = "";
    da = [
      [],
      []
    ];

    for (i = keys.length - 1; i >= 0; i--) {
      //console.log(h[keys[i]]);
      var d = h[keys[i]];
      da[0].push((d.latlng).split(";")[0]);
      da[1].push((d.latlng).split(";")[1]);


      var key = d.key
      latlng = (d.latlng).split(".").join("");

      row = row +
        '<tr id="' + key + '">' +
        '<td>' +
        '<div class="w3-card w3-hover-shadow w3-margin-top w3-row-padding" style="margin-top: 50px;box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);transition: 0.3s;width: 100%; hover:box-shadow: 0 10px 16px 0 rgba(0,0,0,0.2);">' +
        '<div class="w3-third"><img src="' + d.url + '"width="200px" height="300px" />' +
        '</div>' +
        '<div class="w3-rest w3-margin-left">' + '<h6>' + '<strong>Issue Key: </strong>' + d.key + '</h6>' +
        '<h6>' + '<strong>Email: </strong>' + d.email + '</h6>' +
        '<h6>' + '<strong>Location: </strong>' + d.location + '</h6>' +
        '<h6>' + '<strong>Time: </strong>' + d.time + '</h6>' +
        '<h6 style="word-wrap:break-word;">' + '<strong>Description: </strong>' + d.desc + '</h6>' +
        '</div>' +
        '<button id="solve" onClick="myFunction(this)"  class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent">Approved</button>' +
        '</div></td>' +
        '</tr></hr>';
    }
    document.getElementById('issue')
      .innerHTML = row;
  }
}

function errorData(err) {
  console.log(err.message);
}

function myFunction(x) {

  row_no = $(x).closest('tr').attr('id');
  console.log($(x).closest('tr').attr('id'));
  console.log("clicked");
  var database = firebase.database();
  var issuesList = database.ref(type + '/new');

  issuesList.on('value', function(data) {

    var h = data.val();
    var keys = Object.keys(data.val());

    //gives the json
    console.log(h);
    //gives the list array of the headers
    console.log(keys);

    var d = h[row_no];

    firebase.database().ref(type + '/new/' + row_no).set({
      desc: d.desc,
      email: d.email,
      key: d.key,
      latlng: d.latlng,
      location: d.location,
      status: "true",
      time: d.time,
      type: d.type,
      url: d.url,
      // to be added
      worker: ""
    });
    var uemail = d.email;
    uemail = uemail.replace(".", "");
    console.log(uemail);
    firebase.database().ref(type + '/new/' + row_no).remove();
    firebase.database().ref(type + '/old/' + row_no).set({
      desc: d.desc,
      email: d.email,
      key: d.key,
      latlng: d.latlng,
      location: d.location,
      status: "true",
      time: d.time,
      type: d.type,
      url: d.url,
      // to be added
      worker: ""
    });
    firebase.database().ref('issue/' + uemail + '/' + type + '/new/' + d.key).remove();
    firebase.database().ref('issue/' + uemail + '/' + type + '/old/' + d.key).set({
      desc: d.desc,
      key: d.key,
      latlng: d.latlng,
      location: d.location,
      status: "true",
      time: d.time,
      type: d.type,
      url: d.url,
    });
    $(".login-cover").show();
    $(".login-cove").delay("slow").fadeIn();
    init();
  }, errorData);
}


$("#historyBtn").click(
  function() {
    console.log("History butoon clicked");
    $("#oldHistory").show();
    $("#issue").hide();
    $('#analysisPortion').hide();

    var database = firebase.database();
    var issuesList = database.ref(type + '/old');
    issuesList.on('value', function(data) {
      /////
      var h = data.val();
      if (h == null) {
        console.log("emptyyyyyyyyyyyyyyyyyyyyyyyy");
        document.getElementById('oldHistory')
          .innerHTML = "<h1>No Data</h1>";
      } else {
        var keys = Object.keys(data.val());
        //gives the json
        console.log(h);
        //gives the list array of the headers
        console.log(keys);
        //getting the first position of the list
        row = "";
        for (i = keys.length - 1; i >= 0; i--) {
          console.log(h[keys[i]]);
          var d = h[keys[i]];
          var key = d.key
          var latlng = d.latlng;

          row = row +
            '<tr id="' + key + '">' +
            '<td>' +
            '<div class="w3-card w3-hover-shadow w3-margin-top w3-row-padding" style="margin-top: 50px;box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);transition: 0.3s;width: 100%; hover:box-shadow: 0 10px 16px 0 rgba(0,0,0,0.2);">' +
            '<div class="w3-third"><img src="' + d.url + '"width="200px" height="300px" />' +
            '</div>' +
            '<div class="w3-rest w3-margin-left">' + '<h6>' + '<strong>Issue Key: </strong>' + d.key + '</h6>' +
            '<h6>' + '<strong>Email: </strong>' + d.email + '</h6>' +
            '<h6>' + '<strong>Location: </strong>' + d.location + '</h6>' +
            '<h6>' + '<strong>Time: </strong>' + d.time + '</h6>' +
            '<h6 style="word-wrap:break-word;">' + '<strong>Description: </strong>' + d.desc + '</h6>' +
            '</div>' +
            '</div></td>' +
            '</tr></hr>';

        }
        document.getElementById('oldHistory')
          .innerHTML = row;

      }
      ////
    }, errorData);
  }
);

$("#currentBtn").click(
  function() {
    init();
    console.log("Current butoon clicked");
    $("#oldHistory").hide();
    $("#issue").show();
    $('#analysisPortion').hide();
  }
);
$("#analysisBtn").click(
  function() {
    $('#issue').hide();
    $('#analysisPortion').show();
    $("#oldHistory").hide();
    //$('#dataTable').hide();
    analysis();
    analysisTableData();
  }
);

function analysisTableData() {
  var r1 = "";
  var r2 = "";
  citymap = [];
  var a;
  //document.getElementById("content").innerHTML='<object type="text/html" data="pitMap.html" ></object>';
  firebase.database().ref(type + '/group_data').on('value', function(data) {
    var h = data.val();
    row1 = "";
    if (h == null) {
      row1 = "<h1>No data</h1>";
      document.getElementById('analysisTable')
        .innerHTML = row1;
    } else {
      ga = [
        [],
        []
      ];
      row1 = "";
      a = [];
      var keys_h = Object.keys(h);

      for (i = 0; i < keys_h.length; i++) {
        var d = h[keys_h[i]];

        a.push({
          key: keys_h[i],
          count: d.count,
          keys: d.keys
        });
      }
      //Sorting
      a.sort(function(c, b) {
        return (b.count - c.count);
      });
      for (i = 0; i < keys_h.length; i++) {
        row1 = row1 +
          '<tr id="' + a[i].key + '">' +
          '<td>' +
          '<div class="w3-card w3-hover-shadow w3-margin-top w3-row-padding" style="margin-top: 50px;box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);transition: 0.3s;width: 100%; hover:box-shadow: 0 10px 16px 0 rgba(0,0,0,0.2);">' +
          '<div class="w3-rest w3-margin-left">' + '<h6>' + '<strong>Issue Key: </strong>' + keys_h[i] + '</h6>' +
          '<h6 class="w3-badge w3-red">' + '<strong>Count: </strong>' + a[i].count + '</h6>' +
          '<h6>' + '<strong>Keys: </strong>' + (a[i].keys).split(";").join("\t") + '</h6>' +
          '</div>' +
          '<button id="solve" onClick="myFunction2(this)"  class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent">Approved</button>' +
          '</div></td>' +
          '</tr>' +
          '</hr>';

        r1 = getLat(latlngOrignal(keys_h[i]));
        r2 = getLng(latlngOrignal(keys_h[i]));

        citymap.push([keys_h[i], r1, r2, a[i].count]);

        ga[0].push(r1);
        ga[1].push(r2);


      }
      document.getElementById('analysisTable')
        .innerHTML = row1;

      //  console.log(a);
      initMap();
    }
  }, errorData);
}

function initMap() {
  //  console.log(citymap);
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 18,
    center: new google.maps.LatLng(28.86578249999998, 78.7509882812500),
    mapTypeId: google.maps.MapTypeId.SATELLITE
  });

  var infowindow = new google.maps.InfoWindow();

  var marker;

  for (i = 0; i < citymap.length; i++) {
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(citymap[i][1], citymap[i][2]),
      map: map
    });

    var cityCircle = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      map: map,
      center: new google.maps.LatLng(citymap[i][1], citymap[i][2]),
      radius: type_distance
    });

    google.maps.event.addListener(cityCircle, 'click', (function(marker, i) {
      return function() {
        infoWindow.setContent(citymap[i][0]);
        infoWindow.open(map, cityCircle);
      }
    })(cityCircle, i));

    google.maps.event.addListener(marker, 'click', (function(marker, i) {
      return function() {
        infowindow.setContent("Key: " + citymap[i][0] + "\nCount: " + citymap[i][3]);
        infowindow.open(map, marker);
      }
    })(marker, i));

  }
}

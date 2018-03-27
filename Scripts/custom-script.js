 $(document).ready(function() {

     // get the tabs DOM elements
     var tabs = $("body").tabs(); // turns the hyperlinks into tabs

     // JQTabsNavAdaptor is a special constructor that adapts
     // the JQuery tabs to become usable by the navigation framework
     var tabsAdaptor = new bpf.nav.JQTabsNavAdaptor(tabs);

     // create the navigation framework node
     var tabNode = new bpf.nav.Node(tabsAdaptor);

     // connect the navigation framework node to the browser's url hash
     bpf.nav.connectToUrlHash(tabNode);

     // set the url to correspond to the selected tab
     return bpf.nav.setKeySegmentToHash(tabNode);

 });

 // Calculate the minutes difference using server's 'date'
 function getTimeInMinutes(date1, date2) {
     var startTime = new Date(date1);
     var endTime = new Date(date2);
     var difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
     var resultInMinutes = Math.round(difference / 60000);
     return resultInMinutes;
 }

 // Function for comparing values in order to sort an array
 function compare(a, b) {
     if (a.order < b.order)
         return -1;
     if (a.order > b.order)
         return 1;
     return 0;
 }

 // Get the existing records of the database
 var db = firebase.database();
 var map;
 var usersAdventures = db.ref('adventures/');
 var usersCountArr = [];
 var usersCount = 0;
 var usersDistanceArr = [];
 var usersTimeArr = [];
 var usersSpeedArr = [];
 var heatMapPointsArr = [];

 // Take the data and proceed with certain calculations
 usersAdventures.on('value', function(snapshot) {
     //On each adventure
     $.each(snapshot.val(), function(key, value) {
         usersCountArr.push("Χρήστης " + (usersCount += 1));
         var currUserLatsLons = [];
         var startDate = 0;
         var endDate = 0;
         // On each object
         $.each(value, function(key, value) {
             currUserLatsLons.push({ order: value.order, latLng: value.latLng });
             // get start time
             if (value.order == 0) {
                 startDate = value.date;
             }
             // get end time
             if (value.order == 7) {
                 endDate = value.date;
             }
             // gather all map points in an array in order to form a heatmap
             heatMapPointsArr.push(new google.maps.LatLng(value.latLng.latitude, value.latLng.longitude))

         });
         // sort the array of found objects by order
         currUserLatsLons.sort(compare);
         // total distance that each user has walked
         var totalDistance = 0;
         for (var i = 0; i < 8; i++) {
             if (i + 1 <= 7) {
                 totalDistance += google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(currUserLatsLons[i].latLng.latitude, currUserLatsLons[i].latLng.longitude), new google.maps.LatLng(currUserLatsLons[i + 1].latLng.latitude, currUserLatsLons[i + 1].latLng.longitude));
             }
         }

         // total time during which each user was collecting the items
         var totalTime = getTimeInMinutes(startDate, endDate);
         usersDistanceArr.push(totalDistance);
         usersTimeArr.push(totalTime);
         usersSpeedArr.push((totalDistance / 1000) / (totalTime / 60));
     });

 });

 // Set an interval until all necessary data are available
 var interval = setInterval(function() {
     if (usersCountArr.length > 0 &&
         usersDistanceArr.length > 0 &&
         usersTimeArr.length > 0 &&
         usersSpeedArr.length > 0 &&
         heatMapPointsArr.length > 0) {

         // start initializing the charts
         barChart = document.getElementById('bar-chart');
         // Horizontal bar chart that displays distance per user
         var barChartData = [{
             type: 'bar',
             x: usersDistanceArr,
             y: usersCountArr,
             orientation: 'h'
         }];

         var barChartLayout = {
             height: 600,
             width: 1000,
             title: 'Απόσταση που καλύφθηκε ανά χρήστη (μέτρα)',
             titlefont: {
                 family: '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
                 size: 18,
                 color: '#1b8598',
             },
             xaxis: {
                 title: 'Χρήστες',
                 titlefont: {
                     family: '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
                     size: 18,
                     color: '#1b8598'
                 }
             },
             yaxis: {
                 title: 'Απόσταση',
                 titlefont: {
                     family: '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
                     size: 18,
                     color: '#1b8598'
                 }
             }
         };
         // Calculate and show average distance
         var totalUsersDistance = 0;

         for (var i = 0; i < usersDistanceArr.length; i++) {
             totalUsersDistance += usersDistanceArr[i];
         }
         $("#average-distance").append("Μέση απόσταση: " + totalUsersDistance / usersDistanceArr.length + " μέτρα");
         $("#total-distance").append("Συνολική απόσταση: " + totalUsersDistance / 1000 + " χιλιόμετρα");

         // Vertical bar chart that displays the time per user
         horizontalBar = document.getElementById('horizontal-bar');
         var horizontalBarData = [{
             type: 'bar',
             x: usersCountArr,
             y: usersTimeArr
         }];

         var horizontalBarLayout = {
             height: 600,
             width: 1000,
             title: 'Συνολικός χρόνος ανά χρήστη (λεπτά)',

             titlefont: {
                 family: '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
                 size: 18,
                 color: '#1b8598',
             },
             xaxis: {
                 title: 'Διάρκεια (σε λεπτά)',
                 titlefont: {
                     family: '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
                     size: 18,
                     color: '#1b8598'
                 }
             },
             yaxis: {
                 title: 'Χρήστες',
                 titlefont: {
                     family: '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
                     size: 18,
                     color: '#1b8598'
                 }
             }
         };

         // Calculate and show average user's time
         var totalUsersTime = 0;

         for (var i = 0; i < usersTimeArr.length; i++) {
             totalUsersTime += usersTimeArr[i];
         }

         $("#average-time").append("Μέσoς χρόνος: " + totalUsersTime / usersTimeArr.length + " λεπτά");
         $("#total-time").append("Συνολικός χρόνος: " + totalUsersTime / 60 + " ώρες");

         // Line graph that displays speed per user
         lineGraph = document.getElementById('line-graph');
         var lineGraphData = [{
             x: usersCountArr,
             y: usersSpeedArr
         }];
         var lineGraphLayout = {
             height: 600,
             width: 1000,
             title: 'Μέση ταχύτητα ανά χρήστη (χιλιόμέτρα/ώρα)',
             titlefont: {
                 family: '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
                 size: 18,
                 color: '#1b8598',
             },
             xaxis: {
                 title: 'Χρήστες',
                 titlefont: {
                     family: '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
                     size: 18,
                     color: '#1b8598'
                 }
             },
             yaxis: {
                 title: 'Ταχύτητα',
                 titlefont: {
                     family: '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
                     size: 18,
                     color: '#1b8598'
                 }
             }
         };

         // Calculate and display average speed
         var totalUsersSpeed = 0;

         for (var i = 0; i < usersSpeedArr.length; i++) {
             totalUsersSpeed += usersSpeedArr[i];
         }

         $("#average-speed").append("Μέση ταχύτητα: " + totalUsersSpeed / usersSpeedArr.length + " χιλιόμετρα/ώρα");

         // Draw the plots
         Plotly.newPlot(barChart, barChartData, barChartLayout);
         Plotly.newPlot(horizontalBar, horizontalBarData, horizontalBarLayout);
         Plotly.newPlot(lineGraph, lineGraphData, lineGraphLayout);

         // Data for the heatmap (all users' positions)
         heatmap = new google.maps.visualization.HeatmapLayer({
             data: heatMapPointsArr,
             map: map
         });

         // Clear interval and hide loader and overlay
         clearInterval(interval);
         $("#loader").hide();
         $("#overlay").hide();
     }
 }, 500);


 // Initialize map
 function initMap() {
     var uluru = { lat: 37.9648289, lng: 23.6996621 };
     map = new google.maps.Map(document.getElementById('map'), {
         zoom: 13,
         center: uluru
     });
 }

 // Show or hide heatmap
 function toggleHeatmap() {
     heatmap.setMap(heatmap.getMap() ? null : map);
 }

 // Change the color of the heatmap's gradient
 function changeGradient() {
     var gradient = [
         'rgba(0, 255, 255, 0)',
         'rgba(0, 255, 255, 1)',
         'rgba(0, 191, 255, 1)',
         'rgba(0, 127, 255, 1)',
         'rgba(0, 63, 255, 1)',
         'rgba(0, 0, 255, 1)',
         'rgba(0, 0, 223, 1)',
         'rgba(0, 0, 191, 1)',
         'rgba(0, 0, 159, 1)',
         'rgba(0, 0, 127, 1)',
         'rgba(63, 0, 91, 1)',
         'rgba(127, 0, 63, 1)',
         'rgba(191, 0, 31, 1)',
         'rgba(255, 0, 0, 1)'
     ]
     heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
 }

 // Change the readius of the heatmap's areas
 function changeRadius() {
     heatmap.set('radius', heatmap.get('radius') ? null : 20);
 }

 // Change the opacity of the heatmap's area
 function changeOpacity() {
     heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);
 }
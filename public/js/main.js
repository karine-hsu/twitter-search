$(function () {
  
  var values = {
    consumer_key: "tCPnpCSzQ3U4Ry9ixS0Sg",
    consumer_secret: "flVN2l3HTicsj6fXsh6HrJVOMF7o1GBl6w1PoTsCo",
    access_token: "615898424-exwWL0vzdkUAQcz6zeBDQQo4ZrqvEr6FTXU8Eqdq",
    access_token_secret: "Y1dhb6PvLoYOoqkQ51ah4d0lbRC0Z5ES7BwjwvUHY"
  };

  var client = new Codebird;
  client.setConsumerKey(values.consumer_key, values.consumer_secret);
  client.setToken(values.access_token, values.access_token_secret);


  // Clicked on @handle
  var listenForHandleClick = function() {
    $(".handle").children("a").on('click', function (event) {
      displayUserInfo(event);
    });
  };

  var clearListenHandleClick = function() {
    $(".handle").children("a").off();
  };

  listenForHandleClick();

  var listenForDetailsClick = function() {
    $(".details").children("a").on('click', function (event) {
      displayTweetDetails(event);
    });
  };

  var clearListenDetailsClick = function() {
    $(".details").children("a").off();
  }

  listenForDetailsClick();

  // Error prevention: disable button if no query string
  $("#search-button").attr("disabled", "true");
  $("#query").bind('input', function(){
      if ($(this).val() != "") {
          $("#search-button").removeAttr("disabled");
      } else {
          $("#search-button").attr("disabled", "true");        
      }
  }); 

  // Error recognition: sanity check for since/until dates (adv search)
  $("select").change(function(event){
    sanityCheck(event);
  }); 

  var sanityCheck = function(event) {
    // Get class of change event (are we checking the until or since date)
    var div = $(event.target).parents(".date-entry");
    if ($(div).hasClass("since")) { 
      var divClass = "since"; 
    } else if ($(div).hasClass("until")) { divClass = "until"; }
    var selects = $(div).find("select");
    var vals = [];
    for (var i = 0; i < selects.length; i++) {
      var id = $(selects[i]).attr("id");
      var selected = $("#" + id + " option:selected").text();
      vals.push(selected);
    }
    if (vals[0].length == 0 && vals[1].length == 0 && vals[2].length == 0) { // No selections, OK
      showNoSanityCheck(divClass);
    } else if (vals[0].length != 0 && vals[1].length != 0 && vals[2].length != 0) { // All fields have selection
      var date = {
        year: parseInt(vals[2]),
        month: vals[0],
        day: parseInt(vals[1])
      };
      if (isValidDate(date)) {
        showGreen(divClass);
      } else {
        showRed(divClass);
      }
    } else { // Incomplete date
      showRed(divClass);
    }
  };

  var isValidDate = function(date) { // format of date = {year: y, month: m, day: d}
    var today = new Date();
    var months = {
      January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
    };
    var numeratedMonth = months[date.month];
    if (today.getFullYear < date.year) {
      return false
    } else if (today.getFullYear > date.year) {
      return true
    } else { // year = q-year
      if (today.getMonth() < numeratedMonth - 1) {
        return false
      } else if (today.getMonth() > numeratedMonth - 1) {
        return true
      } else { // month = q-month
        if (today.getDate() < date.day) {
          return false
        } else if (today.getDate() >= date.day) {
          return true
        }
      }
    }
    return true
  }

  var showGreen = function(divClass) {
    $("." + divClass).find(".green").css("display", "inline-block");
    $("." + divClass).find(".red").css("display", "none");
  };

  var showRed = function(divClass, reason) {
    $("." + divClass).find(".red").css("display", "inline-block");
    $("." + divClass).find(".green").css("display", "none");
  };

  var showNoSanityCheck = function(divClass) {
    $("." + divClass).find(".green").css("display", "none");
    $("." + divClass).find(".red").css("display", "none");
  };

  // initialize empty array to store search queries
  var searchHistory = [];

  /*************************************************************** 
  Three events that trigger a search:
  1. User clicks the "Search" button
  2. User presses enter
  3. User queries through URL
  ***************************************************************/
  // 1. If the user clicks the "Search" button
  $("#search-button").on('click',function(event) {
      searchClicked();
  });
  // 2. If the user presses enter
  $("#query").keypress(function(event){
      if(event.which == 13){
          event.preventDefault(); // prevents page refresh
          searchClicked();
      }
  }); 
  // 3. If the user queries through URL
  if (window.location.search.length > 1) {
    var arr = window.location.search.split('=');
    if (arr[0] == "?query") { // If valid selector
      var query = arr[1]; // Grab query string
      $("#query").val(query); // Auto fill search box
      var queryObject = { 
          q: query,
          count: 50, 
      };
      search(queryObject);
    } 
  };

  var searchClicked = function() {
    var query = getQueryFromForm();
    if (query.length != 0) {
      var queryObject = _createQueryObject();
      search(queryObject);
    }
  };

  var getQueryFromForm = function() {
    var query = $("#query").val();
    return query;
  };

  /*  data = {
        statuses: statues,
        currIndex: currIndex,
        tweetLimit: tweetLimit
      }
  */
  var watchScrollPosition = function(data) {
    $(window).scroll(data, function(scrollEvent) {
      if($(window).scrollTop() + $(window).height() > $(document).height() - 50) { //near bottom of page
        var newIndex = loadBatchOfTweets(scrollEvent.data).i;
        if (newIndex == scrollEvent.data.statuses.length && (newIndex == 50 || newIndex == 49)) { //If at end of limited results
          $(window).off('scroll');
          $('.main').append('<div id="show-all"><a>Show all results</a></div>');
          $('#show-all').on('click', scrollEvent.data, showAllClicked);
        } else if (newIndex == scrollEvent.data.statuses.length && newIndex > 50) { //If at end of all results
          $(window).off('scroll');
        } else if (newIndex == scrollEvent.data.statuses.length) {
          $(window).off('scroll');
        }
      }
    });
  };

  var showAllClicked = function(event) {
    var data = event.data;
    var query = _getCurrentQuery();
    var lastTweet = data.statuses[data.statuses.length - 1];
    query.count = 100;
    query.max_id = lastTweet.id;
    search(query, true);
  };

  var _getCurrentQuery = function() {
    var query = JSON.parse(sessionStorage.searchHistory)[0];
    return query;
  };

  var search = function(queryObject, isOld) {
    if (!isOld) {
      storeQuery(queryObject);
    }
    client.__call(
      "search_tweets",
      queryObject,
      function (reply) {
        if (!isOld) {
          $('.main').empty();
        }
        if (reply.httpstatus = 200) {
          var statuses = reply.statuses;
          if (reply.statuses.length == 0) {
            appendNoSearchResults();
          } else {
            var currIndex = 0;
            var tweetLimit = 15; // How many tweets to append at a time
            var data = {
              statuses: statuses,
              currIndex: currIndex,
              tweetLimit: tweetLimit
            };
            currIndex = loadBatchOfTweets(data).i;
            watchScrollPosition(data);
          }
        }
        if ($(".twitter-bird").hasClass("active")) {
          $(".twitter-bird").removeClass("active");
        }
        $(".header").text("What are you searching for?");
        $("#show-all").remove();
        clearListenHandleClick();
        listenForHandleClick();
        clearListenDetailsClick();
        listenForDetailsClick();
      }
    ); // client.__call
    $(".twitter-bird").addClass("active");
    $(".header").text("Fetching your tweets... ");
    $("#show-all").children("a").text("Loading all results... ");
  };

  var loadBatchOfTweets = function(data) {
    /*data = {
        statuses: statues,
        currIndex: currIndex,
        tweetLimit: tweetLimit
    }*/
    if (data.currIndex + data.tweetLimit >= data.statuses.length) {
     var bound = data.statuses.length;
    } else {
     bound = data.currIndex + data.tweetLimit;
    }
    for (var i = data.currIndex; i < bound; i++) {
      var tweet = data.statuses[i];
      appendTweetContent(tweet);
    }
    data.currIndex = i;
    var lastTweet = {
      i: data.currIndex,
      lastTweet: data.statuses[i]
    }
    clearListenHandleClick();
    listenForHandleClick();
    clearListenDetailsClick();
    listenForDetailsClick();
    return lastTweet;
  };

  var appendNoSearchResults = function() {
    $('.main').empty();
    $('.main').append(
      '<div class="no-results"><h2>No results :( <br> Try another search? </div></h2>'
    );
  }

  var appendTweetContent = function(tweet) {
    var user = tweet.user;
    if (!user.time_zone) {
      user.time_zone = "Unknown time zone";
    }
    var parsedDate = _parseTwitterDate(tweet.created_at);
    $('.main').append(
      '<div class="tweet-container well row">' +
        '<div class="tweet">' +
          '<div class="profile-image">' +
            '<img class="img-rounded" src="' + user.profile_image_url + '" style="width:70px;">' +
          '</div>' +
          '<div class="content">' +
            '<div class="name">' + user.name + '</div>' +
            '<div class="handle"><a>@' + user.screen_name + '</a></div>' +
            '<div class="user-info">' + 
              '<div class="bio">' + user.description + '</div>' +
              '<div class="tweet-count count-section">' +
                '<span class="count">' + user.statuses_count + ' </span>' +
                '<label> Tweets &bull; </label>' +
              '</div>' +
              '<div class="following-count count-section">' + 
                '<span class="count">' + user.friends_count + ' </span>' +
                '<label> Following &bull; </label>' + 
              '</div>' +
              '<div class="follower-count count-section">' + 
                '<span class="count">' + user.followers_count + ' </span>' +
                '<label> Followers </label>' +
              '</div>' +
              '<hr>' +
            '</div>' + 
            '<div class="text">' + tweet.text + '</div>' +
            '<div class="tweet-info">' +
              '<hr class="top">' +
              '<div class="retweet-count count-section">' + 
                '<span class="count">' + tweet.retweet_count + '</span> <br>' +
                '<label> Retweets </label>' +
              '</div>' +
              '<div class="favorite-count count-section">' +
                '<span class="count">' + tweet.favorite_count + '</span> <br>' +
                '<label> Favorites </label>' +
              '</div>' +
              '<div class="time-zone count-section">' + 
                '<label> &#x25f7; </label>' +
                '<span> ' + user.time_zone + ' &bull; </span>' +
              '</div>' +
              '<div class="via count-section" style="line-height:0px">' +
                '<label> Sent via </label>' + 
                '<span> ' + tweet.source + ' </span>' +
              '</div>' +
              '<hr class="bottom">' +
            '</div> <!-- /tweet-info -->' +
            '<div class="date">' + parsedDate + '</div>' +
            '<div class="details"><a>Show tweet details</a></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  };

  var _parseTwitterDate = function($twitterDate) {
    // twitterDate arrives formatted as Tue Oct 01 22:52:51 +0000 2013
    // convert to local string
    var date = new Date(Date.parse($twitterDate)).toLocaleString();
    // date is now formatted as 10/3/2013 7:31:30 AM 
    var a = date.split(" ");
    var d = a[0]; // 10/3/2013
    var time = a[1].split(":")[0] + ':' + a[1].split(":")[1]; // take out seconds, 7:31
    var ampm = a[2]; // AM
    // format date to look like 3 Oct 2013
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var monthNumber = d.split("/")[0];
    var month = monthNames[monthNumber - 1];
    var day = d.split("/")[1];
    var year = d.split("/")[2];
    var formattedDate = day + ' ' + month + ' ' + year;
    // format date and time to look like 7:31 AM - 3 Oct 2013
    var formattedDateTime = time + ' ' + ampm + ' - ' + formattedDate;

    return formattedDateTime;
  };

  var _createQueryObject = function() {
    var query = getQueryFromForm();
    var since = getDateFromForm("since");
    var until = getDateFromForm("until");
    var place = getPlaceFromForm();
    var queryObject = {
      q: query,
      count: 50,
      since: since,
      until: until,
      place: place
    };
    for (var key in queryObject) {
      if (queryObject.hasOwnProperty(key)) {
        if (queryObject[key].length == 0) {
          delete queryObject[key];
        }
      }
    }
    return queryObject;
  };

  var storeQuery = function(query) {
    if (query != searchHistory[0]) {
      searchHistory.unshift(query);
      var removed = searchHistory.splice(10, Number.MAX_VALUE); // Only store past 10 searches
      sessionStorage.searchHistory = JSON.stringify(searchHistory);
    }
  };

  $("#search-history-button").on('click',function(event) {
      displaySearchHistory();
  });

  var displaySearchHistory = function() {
    $('.search-history').toggle(200);
    var vh = $("#v-or-h").text();
    if (vh == "View") {
      $("#v-or-h").text("Hide");
    } else if (vh == "Hide") {
      $("#v-or-h").text("View");
    }
    $('.search-history').children('.content').empty();
    if (sessionStorage.searchHistory) {
      if (sessionStorage.searchHistory.length > 0) {
        var arr = JSON.parse(sessionStorage.searchHistory);
        for (var i = 0; i < arr.length; i++) {
          var query = arr[i];
          appendHistoryItem(query);
        }
      } else {
      }
    } else {
    }

  };

  var appendHistoryItem = function(query) {
    if (query.since) {
      var sinceStr = "Since: " + query.since;
    } else {
      sinceStr = "";
    }
    if (query.until) {
      var untilStr = "Until: " + query.since;
    } else {
      untilStr = "";
    }
    if (query.place) {
      var placeStr = "Place: " + query.place;
    } else { placeStr = ""; }
    $('.search-history').children('.content').append(
      '<div class="item">' +
        '<span class="keyword">' + query.q + '</span>' +
        '<span class="options since">' + sinceStr + '</span>' +
        '<span class="options until">' + untilStr + '</span>' +
        '<span class="options place">' + placeStr + '</span>' +
      '</div>');
  };

  // Advanced search stuff
  $("#adv-search-button").on('click',function(event) {
      displayAdvancedSearchOptions();
  });

  var displayAdvancedSearchOptions = function () {
    $('.advanced').toggle(200);
    var ab = $("#a-or-b").text();
    if (ab == "Advanced") {
      $("#a-or-b").text("Basic");
    } else if (ab == "Basic") {
      $("#a-or-b").text("Advanced");
    }
  };

  // Gets date from specified form, strings "either" or "since" 
  // Returns formatted date YYYY-MM-DD or empty string if no input
  var getDateFromForm = function(untilOrSince) {
    var month = $( "#" + untilOrSince + "-month option:selected" ).val();
    var day = $( "#" + untilOrSince + "-day option:selected" ).text();
    var year = $( "#" + untilOrSince + "-year option:selected" ).text();
    if (month.length == 0 || day.length == 0 || year.length == 0) {
      return "";
    } else {
      var formatted = year + '-' + month + '-' + day;
      return formatted;
    }
  };

  // Returns formatted date YYYY-MM-DD or empty string if no input
  var getSinceDateFromForm = function() {
    var month = $( "#since-month option:selected" ).val();
    var day = $( "#since-day option:selected" ).text();
    var year = $( "#since-year option:selected" ).text();
    if (month.length == 0 || day.length == 0 || year.length == 0) {
      return "";
    } else {
      var formatted = year + '-' + month + '-' + day;
      return formatted;
    }
  };

  // Returns formatted date YYYY-MM-DD or empty string if no input
  var getUntilDateFromForm = function() {
    var month = $( "#until-month option:selected" ).val();
    var day = $( "#until-day option:selected" ).text();
    var year = $( "#until-year option:selected" ).text();
    if (month.length == 0 || day.length == 0 || year.length == 0) {
      return "";
    } else {
      var formatted = year + '-' + month + '-' + day;
      return formatted;
    }
  };

  // Returns place or empty string if no input
  var getPlaceFromForm = function() {
    var place = $("#adv-place").val();
    if (place.length == 0) {
      return "";
    } else {
      return place;
    }
  };

  $("#test-button").on('click',function(event) {
      
  });

  var displayUserInfo = function (event) {
    var userinfo = $(event.target).parents(".handle").siblings(".user-info");
    $(userinfo).toggle("slow");
  };

  var displayTweetDetails = function (event) {
    var tweetInfo = $(event.target).parents(".details").siblings(".tweet-info");
    $(tweetInfo).toggle("slow");
    if ($(event.target).text() == "Show tweet details") {
      $(event.target).text("Hide tweet details");
    } else if ($(event.target).text() == "Hide tweet details") {
      $(event.target).text("Show tweet details");
    }
  };

});




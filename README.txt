
Interface Design:

In my design of the application, I tried to design an aesthetic and minimalist interface that draws the user to conduct a search. The big search bar, the large header prompt, and the large green “Search Twitter” button makes it obvious that search is the central function of my application.
If the user does not input a keyword into the search bar, the green search button is disabled to prevent users from making the error of conducting an empty search. The green button is only enabled when the user enters a keyword.

The advanced search options and search history are hidden by default as those two functions are not integral to the general task of searching, so the options are only displayed if the user requests for those options. I used sessionStorage to store the user’s search history, so in case the user refreshes the page, their search history is still accessible. (sessionStorage does not persist across sessions)

I implemented three options for an advanced search: until, since, and place. For the optional until and since date fields, there are dropdown menus to prevent users from inputting a date in the wrong format. If the user inputs an invalid date (eg if the user does not input a complete month, day and year, or if the user inputs a future date), a red x appears next to it, flagging the invalid input. When the user inputs a valid date, there will be a green check mark next to the field. There is a text box for the optional place input, the input is a Twitter ID string.

After the user clicks search, the header prompt changes to text that says “Loading search results” and the twitter bird animates to inform the user of the status of the system. The header prompt and the bird go back to its original state when the results are populated on the page.

The tweets automatically display: 1. User’s name 2. @handle 3. text 4. time/date of tweet (local time). To get additional user information, the user can click on the @handle and the bio, # of followers/following will be displayed within the same tweet container. To get additional tweet details, the user can click on the “Show tweet details” link and the # of retweets/favorites, time zone, and source will be displayed. The design and layout of the tweet is roughly similar to the design and layout of twitter’s timeline. I decided to stick to the classic design of Twitter so that the user would be familiar with the interface.

Although the number of tweets results from twitter is defaulted to 50, only 15 tweets are actually
appended to the DOM at a time. Using jQuery, the application detects when the user scrolls near the end of the window, and loads 15 more. At the end of the 50 results, there is a button that says “show all results”, which gets the next 100 tweets (100 is the max count in the API).

Libraries used:
Bootstrap jQuery Initializer

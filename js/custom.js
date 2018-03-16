
var firData;

var savedSearch = "nil";
var numBackspace = 0;

var filterGlobalCore = false;
var filterTechnical = false;
var filterNonTechnical = false;
var minLevel = 1000;
var maxLevel = 4000;
var filterGold = false;
var filterSilver = false;

var tableData = [];
var pageNumber = 0;

var leftPageEnabled = false;
var rightPageEnabled = false;

var firstRun = true;

var ipAddress = "";
var userIDset = false;

var showProfs = true;
var queryNum = "s1"


function ab(b){
	if (b) {
		return "O";
	}
	return "X";
}

function filter(){
	//console.log("started filter");
	document.getElementById("submitquery").disabled = true;
	setTimeout(function(){document.getElementById("submitquery").disabled = false;}, 700);
	var textParam = null;//retrieveElement("textparam");
	if (!textParam) {textParam = "";}
	var lastSunday = dateOfLastSunday();
	writeData("PrivateStatistics/Searches/" + lastSunday + "/" + Date.now() + " " + $.cookie('userID'), "T: " + ab(filterTechnical) + ", NT: " + ab(filterNonTechnical) + 
		", GC: " + ab(filterGlobalCore) + ", Min: " + (minLevel/1000) + ", Max: " + (maxLevel/1000) + ", SN: " + ab(filterSilver) + ", GN: " + ab(filterGold));

	var datArr = substrSearch(textParam,"s6",true);
	if (filterGold || filterSilver){
		datArr = datArr.filter(function(e){
			var name = e["profName"];
			if (filterGold){
				for (var i = 0; i < goldNuggets["professors"].length; i++) {
					var firstName = goldNuggets["professors"][i]["first_name"];
					var lastName = goldNuggets["professors"][i]["last_name"];
					if (name.indexOf(firstName) >= 0 && name.indexOf(lastName) >= 0){
						return true;
					} 
				}
			} 
			if (filterSilver){
				for (var i = 0; i < silverNuggets["professors"].length; i++) {
					var firstName = silverNuggets["professors"][i]["first_name"];
					var lastName = silverNuggets["professors"][i]["last_name"];
					if (name.indexOf(firstName) >= 0 && name.indexOf(lastName) >= 0){
						return true;
					} 
				}
			}
			return false;
		});
	} 
	if (filterGlobalCore){
		datArr = datArr.filter(function(e){
			var id = e["id"].split(' ');
			for (var i = 0; i < globalCores.length; i++) {
				var gcID = globalCores[i];
				if (gcID.indexOf(id[0]) >= 0 && gcID.indexOf(id[1]) >= 0){
					return true;
				} 
			}
			return false;
		});
	}
	if (filterTechnical){
		datArr = datArr.filter(function(e){
			var id = e["id"].split(' ');
			return $.inArray(id[0], techs) != -1;
		});
	}
	if (filterNonTechnical){
		datArr = datArr.filter(function(e){
			var id = e["id"].split(' ');
			return $.inArray(id[0], nontechs) != -1;
		});
	}
	if (document.getElementById('levelcheckboxmin').checked) {
		datArr = datArr.filter(function(e){
			var sig = (e["id"].split(' '))[1];
			return Number(sig.charAt(sig.length-4))*1000 >= minLevel;
		});
	}
	if (document.getElementById('levelcheckboxmax').checked) {
		datArr = datArr.filter(function(e){
			var sig = (e["id"].split(' '))[1];
			return Number(sig.charAt(sig.length-4))*1000 <= maxLevel;
		});
	}

	//console.log("Done!");
	datArr.sort(function(a,b) {
		return (a["ar"] < b["ar"]) ? 1 : ((b["ar"] < a["ar"]) ? -1 : 0);} );
		//console.log(datArr);
		setTable(0,datArr);
		$("#searchres").html("<font color=\"grey\"><b>("+ datArr.length +" Results)</b></font>");

		if (datArr.length > 0){
			$("#tableerror").html("");
		} else {
			$("#tableerror").html("<b>No results matched your search</b>");
		}

		return firebase.database().ref().child("Statistics").once('value').then(function(snapshot) {
			if (window.location.protocol == 'https:'){
				var data = snapshot.val();
				var toWrite = data["Search-Queries"];
				writeData("Statistics/Search-Queries",toWrite+1);
			}
		});
	}

	function nextPage() {
		if (rightPageEnabled){
			pageNumber++;
			setTable(pageNumber,tableData);
		}
	}

	function lastPage() {
		if (leftPageEnabled){
			pageNumber--;
			setTable(pageNumber,tableData);
		}
	}

	function resize() { 
		$('.popover').popover('hide')
	}

	function setTable(page,data) {

		console.log("DATA: "+data);

		for (var i = 0; i < data.length; i++) {
			console.log("\n------------------------------");
			console.log(data[i]["course_name"]);
			console.log(data[i]["course_ID"]);
		}

		var coursesPerPage = 16;

		if (rightPageEnabled = (data.length > coursesPerPage*(page+1))){
			$("#rightarrow").html("<img src=\"assets/rightpage.png\" style=\"height:20px;\">");
		} else {
			$("#rightarrow").html("<img src=\"assets/rightpagedis.png\" style=\"height:20px;\">");
		}
		if (leftPageEnabled = (page != 0)){
			$("#leftarrow").html("<img src=\"assets/leftpage.png\" style=\"height:20px;\">");
		} else {
			$("#leftarrow").html("<img src=\"assets/leftpagedis.png\" style=\"height:20px;\">");
		}
		tableData = data;
		pageNumber = page;
		$("#pagenum").html("Page " + (page+1));
		var str = "<thead>";
		str += "<tr class=\"active\">";
		str += "<th>#</th>";
		str += "<th>Inst. Quality</th>";
		str += "<th>Professor</th>";
		str += "<th>Course ID</th>";
		str += "<th>Course Name</th>"
		str += "<th>A-Range</th>"
		str += "</tr>"
		str += "</thead>"
		str += "<tbody>";
		var maxProfLen = 27;
		var maxCourseLen = 35;
		for (var i=page*coursesPerPage; i<coursesPerPage*(page+1); i++){
			if (i < data.length){				
				str += "<tr>";
				str += "<td>" + (i+1) + "</td>";

				str += "<td>"+data[i]["Instructor_Quality"][0].toString().substring(0,4) + " &plusmn " + data[i]["Instructor_Quality"][1].toString().substring(0,4) + "</a>" + "</td>";

				if (data[i]["Instructor"].length < maxProfLen){
					str += "<td>" + data[i]["Instructor"] + "</td>";
				} else {
					str += "<td>" + data[i]["Instructor"].substring(0,maxProfLen-2) + "...</td>";
				}
				str += "<td>" + data[i]["course_ID"] + "</td>";
				if (data[i]["course_name"].length < maxCourseLen){
					str += "<td>" + data[i]["course_name"] + "</td>";
				} else {
					str += "<td>" + data[i]["course_name"].substring(0,maxCourseLen-2) + "...</td>";
				}
				var percentageStr = data[i]["query"][0].toString().substring(0,4) + " &plusmn " + data[i]["query"][1].toString().substring(0,4)
				
				console.log(percentageStr);
				str += "<td>"+percentageStr + "</a>" + "</td>";
				str += "</tr>";
			} else {
				str += "<tr>";
				str += "<td><img src=\"assets/whiteRect.png\" id=\"nuggetimg\"></td>";
				str += "<td></td>";
				str += "<td></td>";
				str += "<td></td>";
				str += "<td></td>";
				str += "<td></td>";
				str += "</tr>";
			}
		}
		str += "</tbody>";

		$(document).ready(function(){
			$('[data-toggle="popover"]').popover().click(function(e) {
				e.preventDefault();
			});
		});


		document.getElementById('datatable').innerHTML = str;
	}	 


	function round(nums,dec)
	{
		return [Number( nums[0].toString().substring(0,dec+2)),Number( nums[1].toString().substring(0,dec+2)),Number(nums[2])]
	}

	function cleanStr(str){
		var preoutput = str.trim();
		preoutput = preoutput.toLowerCase();
		var arr = preoutput.split(' ');
		var output = "";
		for (var i=0;i<arr.length;i++){
			if (arr[i].toLowerCase() != "i" && arr[i].toLowerCase() != "ii" && arr[i].toLowerCase() != "iii" && arr[i].toLowerCase() != "iv"
				&& arr[i].toLowerCase() != "i:" && arr[i].toLowerCase() != "ii:" && arr[i].toLowerCase() != "iii:" && arr[i].toLowerCase() != "iv:"){
				output += " " + arr[i].charAt(0).toUpperCase() + arr[i].substring(1);
		} else {
			output += " " + arr[i].toUpperCase();
		}
	}
	return output.trim();
}

$( "#searchbar" ).keydown(function(event) {
	var input = document.getElementById('searchbar');
	var key = event.which;
	if (key == 8 && numBackspace == 0){
		savedSearch = (retrieveElement("searchbar")).trim();
		numBackspace++;
	} else if (key == 8 && numBackspace != 2){
		numBackspace++;
	} else if (key == 8 && numBackspace == 2){
		if (savedSearch.length > 3){
			var lastSunday = dateOfLastSunday();
			writeData("PrivateStatistics/Searches/" + lastSunday + "/" + Date.now() + " " + $.cookie('userID'),savedSearch);
		}
		numBackspace++;
	} else {
		numBackspace = 0;
	}
});

function dateOfLastSunday(){
	var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
	var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	var now = new Date();
	var day = days[ now.getDay() ];
	var daysAhead = days.indexOf(day);
	var sunday = new Date();
	sunday.setDate(sunday.getDate()-daysAhead);
	sunday.setHours(0,0,0,0);
	return (sunday.getYear()+1900) + " (" + sunday.getWeekNumber() + ") " + months[sunday.getMonth()] + " " + sunday.getDate();
}

Date.prototype.getWeekNumber = function(){
	var d = new Date(+this);
	d.setHours(0,0,0,0);
	d.setDate(d.getDate()+4-(d.getDay()||7));
	return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};

function searchChange(){
	var searchText = retrieveElement("searchbar")
	if (searchText.length == 0) {
		$("#tableerror").html("");
		setTable(0,[]);
		$("#searchres").html("<font color=\"grey\"><b>Search Results</b></font>");
	} else if (searchText.length < 3){
		$("#tableerror").html("<b>Search must be at least 3 characters long</b>");
		setTable(0,[]);
		$("#searchres").html("<font color=\"grey\"><b>Search Results</b></font>");
	} else {
		var matching = substrSearch(searchText,"s6",true);
		matching.sort(function(a,b) { return (a["ar"] < b["ar"]) ? 1 : ((b["ar"] < a["ar"]) ? -1 : 0);} );
		setTable(0,matching);
		$("#searchres").html("<font color=\"grey\"><b>("+ matching.length +" Results)</b></font>");
		if (matching.length > 0){
			$("#tableerror").html("");
		} else {
			$("#tableerror").html("<b>No results matched your search</b>");
		}
	}
}

function init(){
	//console.log("Build 289");
	var config = {
		apiKey: "AIzaSyCbrQzainAk71S-KJByf8GdMs7zNPxm03g",
		authDomain: "scorecu-93fcb.firebaseapp.com",
		databaseURL: "https://scorecu-93fcb.firebaseio.com",
		projectId: "scorecu-93fcb",
		storageBucket: "scorecu-93fcb.appspot.com",
		messagingSenderId: "1076861733660"
	};


	firebase.initializeApp(config);	
	
	document.getElementById("submitquery").disabled = true;

	var ref = firebase.database().ref();
	ref.child("Data").on("value", function(snapshot) {
		this.firData = snapshot.val();
	});

	ref.child("Z-Message").on("value", function(snapshot) {
		var mes = snapshot.val();
		$("#message").html("<b>" + mes + "</b>");
	});

	window.onresize = resize;

	setTable(0,[]);

	jQuery("button").click(function(e){
	 	//console.log(e.target.id);
	 	switch (e.target.id) {
	 		case "showprofs":
	 		if (showprofs){
	 			document.getElementById("showprofs").className = "btn btn-lg col-xs-12";
	 		} else {
	 			document.getElementById("showprofs").className = "btn btn-lg col-xs-12 glowing";
	 		}
	 		showprofs = !showprofs;
	 		console.log("showprofs: "+showprofs)
	 		break;
	 		case "technical":
	 		if (filterTechnical){
	 			document.getElementById("technical").className = "btn btn-lg col-xs-12";
	 		} else {
	 			document.getElementById("technical").className = "btn btn-lg col-xs-12 glowing";
	 		}
	 		filterTechnical = !filterTechnical;
	 		filterNonTechnical = false;
	 		document.getElementById("nontechnical").className = "btn btn-lg col-xs-12 top15";
	 		filterGlobalCore = false;
	 		document.getElementById("globalcore").className = "btn btn-lg col-xs-12 top15";
	 		break;
	 		case "nontechnical":
	 		if (filterNonTechnical){
	 			document.getElementById("nontechnical").className = "btn btn-lg col-xs-12 top15";
	 		} else {
	 			document.getElementById("nontechnical").className = "btn btn-lg col-xs-12 top15 glowing";
	 		}
	 		filterNonTechnical = !filterNonTechnical;
	 		filterTechnical = false;
	 		document.getElementById("technical").className = "btn btn-lg col-xs-12";
	 		filterGlobalCore = false;
	 		document.getElementById("globalcore").className = "btn btn-lg col-xs-12 top15";
	 		break;
	 		case "globalcore":
	 		if (filterGlobalCore){
	 			document.getElementById("globalcore").className = "btn btn-lg col-xs-12 top15";
	 		} else {
	 			document.getElementById("globalcore").className = "btn btn-lg col-xs-12 top15 glowing";
	 		}
	 		filterGlobalCore = !filterGlobalCore;
	 		filterTechnical = false;
	 		document.getElementById("technical").className = "btn btn-lg col-xs-12";
	 		filterNonTechnical = false;
	 		document.getElementById("nontechnical").className = "btn btn-lg col-xs-12 top15";
	 		break;
	 		case "goldnuggetbtn":
	 		case "goldnuggetimg":
	 		if (filterGold){
	 			document.getElementById("goldnuggetbtn").className = "btn btn-lg col-xs-5 col-xs-push-2";
	 		} else {
	 			document.getElementById("goldnuggetbtn").className = "btn btn-lg col-xs-5 col-xs-push-2 glowing";
	 		}
	 		filterGold = !filterGold;
	 		break;
	 		case "silvernuggetbtn":
	 		case "silvernuggetimg":
	 		if (filterSilver){
	 			document.getElementById("silvernuggetbtn").className = "btn btn-lg col-xs-5 col-xs-push-0";
	 		} else {
	 			document.getElementById("silvernuggetbtn").className = "btn btn-lg col-xs-5 col-xs-push-0 glowing";
	 		}
	 		filterSilver = !filterSilver;
	 		break;
	 		default:
	 	}
	 });

	jQuery(".dropBtn").click(function(e){
		e.preventDefault();
		switch (e.target.id) {
			case "onekmin": 
			minLevel = 1000;
			break;
			case "twokmin": 
			minLevel = 2000;
			break;
			case "threekmin": 
			minLevel = 3000;
			break;
			case "fourkmin": 
			minLevel = 4000;
			break;
			case "fivekmin": 
			minLevel = 5000;
			break;
			case "sixkmin": 
			minLevel = 6000;
			break;
			case "onekmax": 
			maxLevel = 1000;
			break;
			case "twokmax": 
			maxLevel = 2000;
			break;
			case "threekmax": 
			maxLevel = 3000;
			break;
			case "fourkmax": 
			maxLevel = 4000;
			break;
			case "fivekmax": 
			maxLevel = 5000;
			break;
			case "sixkmax": 
			maxLevel = 6000;
			break;
			default:
			alert("The target id is: " + e.target.id + ". This shouldn't happen.");

		}
		$("#minCover").html(minLevel + "   <span class=\"caret\"></span>");
		$("#maxCover").html(maxLevel + "   <span class=\"caret\"></span>");
	});

	

	window.addEventListener("beforeunload", function(e){
		var searchBarText = retrieveElement("searchbar");
		if (searchBarText.length > 3){
			var lastSunday = dateOfLastSunday();
			writeData("PrivateStatistics/Searches/" + lastSunday + "/" + Date.now() + " " + $.cookie('userID'),searchBarText);
		}
	}, false);

	return firebase.database().ref().child("Statistics").once('value').then(function(snapshot) {
		var data = snapshot.val();		
		if (window.location.protocol == 'https:'){
			var cookies = $.cookie();
			if ('userID' in cookies && $.cookie('userID') in data["Users"]){
				var currentID = $.cookie('userID');
				console.log("Old user:", currentID);
				var count = data["Users"][currentID];
				writeData("Statistics/Users/" + currentID,count+1);
				if (currentID != "qxyru3" && currentID != "DAXO5F"){
					writeData("Statistics/Visits",data["Visits"]+1);
				}
			} else {
				console.log("New user");	
				var newID = makeid(6);
				$.cookie('userID', newID, { expires: 1000 });
				writeData("Statistics/Users/" + newID,1);
				writeData("Statistics/Visits",data["Visits"]+1);
			}
			userIDset = true;
		} else {
			console.log("Running Locally");
		}
	});
}

function getCourseData(tree, courseID, question){
	var courseData = tree["CourseIDs"][courseID]
	var output = {"course_name":courseData["course_name"], "course_ID":courseID}
	for (var key in courseData) {
		if (courseData.hasOwnProperty(key)) {

			if (key == question){
				output["query"] = courseData[key];
			}

		}
	}

	return output;
}

function substrSearch(substr, question, showProfs){

		var tree = firData

		//console.log(tree);

		substr = substr.toLowerCase();

		var output = [];

		for (var courseID in tree["CourseIDs"]) {
			if (tree["CourseIDs"].hasOwnProperty(courseID)) {

				if (courseID.toLowerCase().includes(substr) || tree["CourseIDs"][courseID]["course_name"].toLowerCase().includes(substr)){


					if (!showProfs){
						if (question in tree["CourseIDs"][courseID])
							output.push(getCourseData(tree,courseID, question));
					} else {
						var profsForThisClass = tree["CourseIDs"][courseID]["professors"];
						console.log(courseID);
						console.log(profsForThisClass);
						if (profsForThisClass){
							for (var i=0; i<profsForThisClass.length;i++){
								if (question in tree["CourseIDs"][courseID]){
									var d = getCourseData(tree,courseID, question)
									d["Instructor"] = profsForThisClass[i]
									d["Instructor_Quality"] = tree["Profs"][profsForThisClass[i]][courseID]
									output.push(d);
								}
							}
						}
					}
				}



			}
		}

		if (showProfs){

			for (var profName in tree["Profs"]) {
				if (tree["Profs"].hasOwnProperty(profName)) {

					if (profName.toLowerCase().includes(substr)){

						for (var courseID in tree["Profs"][profName]) {
							if (tree["Profs"][profName].hasOwnProperty(courseID)) {
								if (question in tree["CourseIDs"][courseID]){
									var d = getCourseData(tree,courseID, question)
									d["Instructor"] = profName
									d["Instructor_Quality"] = tree["Profs"][profName][courseID]
									output.push(d);
								}
							}
						}
					}
				}
			}
		}

		return output;


	}
	

		$("#searchForm").submit(function() {
			return false;
		});

		$("#filterform").submit(function() {
			return false;
		});




     function retrieveElement(id) {
     	var txtbox = document.getElementById(id);
     	return txtbox.value;
     }

     function writeData(path,obj) {
     	firebase.database().ref().child(path).set(obj);
     }


     function makeid(length)
     {
     	var text = "";
     	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

     	for( var i=0; i < length; i++ )
     		text += possible.charAt(Math.floor(Math.random() * possible.length));

     	return text;
     }

//Taken from http://stackoverflow.com/a/11958496/5057543
function levDist(s, t) {
    var d = []; //2d matrix

    // Step 1
    var n = s.length;
    var m = t.length;

    if (n == 0) return m;
    if (m == 0) return n;

    //Create an array of arrays in javascript (a descending loop is quicker)
    for (var i = n; i >= 0; i--) d[i] = [];

    // Step 2
for (var i = n; i >= 0; i--) d[i][0] = i;
	for (var j = m; j >= 0; j--) d[0][j] = j;

    // Step 3
for (var i = 1; i <= n; i++) {
	var s_i = s.charAt(i - 1);

        // Step 4
        for (var j = 1; j <= m; j++) {

            //Check the jagged ld total so far
            if (i == j && d[i][j] > 4) return n;

            var t_j = t.charAt(j - 1);
            var cost = (s_i == t_j) ? 0 : 1; // Step 5

            //Calculate the minimum
            var mi = d[i - 1][j] + 1;
            var b = d[i][j - 1] + 1;
            var c = d[i - 1][j - 1] + cost;

            if (b < mi) mi = b;
            if (c < mi) mi = c;

            d[i][j] = mi; // Step 6

            //Damerau transposition
            if (i > 1 && j > 1 && s_i == t.charAt(j - 2) && s.charAt(i - 2) == t_j) {
            	d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
            }
        }
    }
    // Step 7
    return d[n][m];
}
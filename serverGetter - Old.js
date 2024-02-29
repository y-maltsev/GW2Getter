 //--------------------------------------------------------------------------------------------------------
//-----------------------------------------DataGathering----------------------------------------------------------
//--------------------------------------------------------------------------------------------------------
var urlApi = 'https://api.guildwars2.com/v2/';
var urlTPPrices = 'commerce/prices';

var path = require('path');

function GetFetchStr(url, pageNum)
{
	if(pageNum !== undefined)
		return  urlApi + url + '?page=' + pageNum + '&page_size=200';
	return urlApi + url;
}

const fetch = require('node-fetch');
fs = require('fs');

var current = 0
var increase = function(clicksAtOnce, repeatInterval) {
    var ii = function() {
        current += 1;
    };
    return setInterval(ii, repeatInterval);
};
increase (1, 1000);

var tradePostPricesDataCurrent = [];
var tradePostPricesDataPrevious = [];
var tradePostPricesDataHistory = [];
var tradePostPricesDataFinal = [];

function ConvertAllExcessHistoryData()
{
    ConvertExcessHistoryData('140');
    ConvertExcessHistoryData('5min');
    ConvertExcessHistoryData('1hour');
    RemoveAllExcessHistory('1day');
}

function GetSaveFileName()
{
    return path.join(__dirname, 'history.txt');
}

function LoadSavedData()
{ 
    //console.log(GetSaveFileName())
    if (fs.existsSync(GetSaveFileName())) {
        fs.readFile(GetSaveFileName(), function(err, data) {
            tradePostPricesDataHistory = JSON.parse(data);
            //console.log("Loaded: " + tradePostPricesDataHistory.length);
            ConvertAllExcessHistoryData();
            CalcFinalData();
        });
    }
}

function SaveData()
{
    //console.log(GetSaveFileName())
    fs.writeFile(GetSaveFileName(), JSON.stringify(tradePostPricesDataHistory), function (err) {if (err) return err;})
}

function SaveCurrentToPrevious()
{
    for (var key in tradePostPricesDataCurrent) 
    {
        tradePostPricesDataPrevious[key] = tradePostPricesDataCurrent[key]
    }
}

function CopyArray(array)
{
    if(array === undefined)
        return [];
    var copy = []
    for (var key in array) 
    {
        copy[key] = array[key]
    }
    return copy
}

function CalcFinalData()
{
    //consolelog("CalcFinalData 1") 
    tradePostPricesDataFinal = []
    for (var keyh in tradePostPricesDataHistory) 
    {
        var history = tradePostPricesDataHistory[keyh]
        for(var key in history)
        {
            var itemEntry = history[key]
            if(itemEntry === undefined || itemEntry === null || !('bought' in itemEntry) || !('sold' in itemEntry)  || !('bids' in itemEntry) || !('offers' in itemEntry))
                continue;
            var itemId = itemEntry.id
            if(tradePostPricesDataFinal[itemId] === undefined || tradePostPricesDataFinal[itemId] === null)
            {
                tradePostPricesDataFinal[itemId] = {}
                tradePostPricesDataFinal[itemId].bought1hour = 0
                tradePostPricesDataFinal[itemId].bought1day = 0 
                tradePostPricesDataFinal[itemId].bought1week = 0
                tradePostPricesDataFinal[itemId].sold1hour = 0
                tradePostPricesDataFinal[itemId].sold1day = 0
                tradePostPricesDataFinal[itemId].sold1week  = 0

                tradePostPricesDataFinal[itemId].bids1hour = 0
                tradePostPricesDataFinal[itemId].bids1day = 0
                tradePostPricesDataFinal[itemId].bids1week  = 0
                tradePostPricesDataFinal[itemId].offers1hour = 0
                tradePostPricesDataFinal[itemId].offers1day = 0
                tradePostPricesDataFinal[itemId].offers1week  = 0
            }
            if(Date.now() - history[0].time < GetTimeTreshold('5min'))
            {
                tradePostPricesDataFinal[itemId].bought1hour += itemEntry.bought;
                tradePostPricesDataFinal[itemId].bought1day += itemEntry.bought;
                tradePostPricesDataFinal[itemId].bought1week  += itemEntry.bought;
                tradePostPricesDataFinal[itemId].sold1hour  += itemEntry.sold;
                tradePostPricesDataFinal[itemId].sold1day  += itemEntry.sold;
                tradePostPricesDataFinal[itemId].sold1week  += itemEntry.sold;
                tradePostPricesDataFinal[itemId].bids1hour  += itemEntry.bids;
                tradePostPricesDataFinal[itemId].bids1day  += itemEntry.bids;
                tradePostPricesDataFinal[itemId].bids1week  += itemEntry.bids;
                tradePostPricesDataFinal[itemId].offers1hour  += itemEntry.offers;
                tradePostPricesDataFinal[itemId].offers1day  += itemEntry.offers;
                tradePostPricesDataFinal[itemId].offers1week  += itemEntry.offers;
            }
            else if(Date.now() - history[0].time < GetTimeTreshold('1hour'))
            { 
                tradePostPricesDataFinal[itemId].bought1day += itemEntry.bought;
                tradePostPricesDataFinal[itemId].bought1week  += itemEntry.bought;
                tradePostPricesDataFinal[itemId].sold1day  += itemEntry.sold;
                tradePostPricesDataFinal[itemId].sold1week  += itemEntry.sold;
                tradePostPricesDataFinal[itemId].bids1day  += itemEntry.bids;
                tradePostPricesDataFinal[itemId].bids1week  += itemEntry.bids;
                tradePostPricesDataFinal[itemId].offers1day  += itemEntry.offers;
                tradePostPricesDataFinal[itemId].offers1week  += itemEntry.offers;
            }
            else if(Date.now() - history[0].time < GetTimeTreshold('1day'))
            { 
                tradePostPricesDataFinal[itemId].bought1week  += itemEntry.bought;
                tradePostPricesDataFinal[itemId].sold1week += itemEntry.sold;
                tradePostPricesDataFinal[itemId].bids1week  += itemEntry.bids;
                tradePostPricesDataFinal[itemId].offers1week  += itemEntry.offers;
            }
            if(tradePostPricesDataCurrent[itemId] !== null && tradePostPricesDataCurrent[itemId] !== undefined)
            {
                tradePostPricesDataFinal[itemId].buyPrice = tradePostPricesDataCurrent[itemId].buys.unit_price;
                tradePostPricesDataFinal[itemId].sellPrice = tradePostPricesDataCurrent[itemId].sells.unit_price;
                tradePostPricesDataFinal[itemId].demand = tradePostPricesDataCurrent[itemId].buys.quantity;
                tradePostPricesDataFinal[itemId].supply = tradePostPricesDataCurrent[itemId].sells.quantity;
            }
        }
    }
    //consolelog(JSON.stringify(tradePostPricesDataFinal[36038]))
    SendHistory();
}

function GetTimeTreshold(type)
{
    if(type == '140')
        return 1000 * 60 * 5
    if(type == '5min')
        return 1000 * 60 * 60
    if(type == '1hour')
        return 1000 * 60 * 60 * 24
    if(type == '1day')
        return 1000 * 60 * 60 * 24 * 7
}

function GetNextTierType(type)
{
    if(type == '140')
        return '5min'
    if(type == '5min')
       return '1hour'
    if(type == '1hour')
        return '1day'
    if(type == '1day')
        return '1week'
}

function RemoveAllExcessHistory(type) 
{
  var time_passed_treshold  = GetTimeTreshold(type);
  var i = 0;
  var arr = tradePostPricesDataHistory;
  if(arr.length == 0)
    return;
  while (i < arr.length) {
    if (arr[i] === undefined ||  arr[i] === null || ( arr[i][0].type == type && Date.now() - arr[i][0].time > time_passed_treshold)) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  SaveData();
  return arr;
}

function ConvertExcessHistoryData(type)
{
    var max_time
    var newData
    for (var keyH in tradePostPricesDataHistory) 
    {
        var history = tradePostPricesDataHistory[keyH]
        var metaData = history[0]
        if(metaData.type != type)
            continue;
        if(Date.now() - metaData.time < GetTimeTreshold(type))
            continue;
        if(max_time === undefined || max_time < metaData.time)
            max_time = metaData.time;
        if(newData === undefined)
        {
            newData = CopyArray(history)
            continue;
        }
        var i 
        for(var key in history)
        {
            if(history[key] === undefined || history[key] === null || !('bought' in history[key]) || !('sold' in history[key]) || !('bids' in history[key]) || !('offers' in history[key]))
                continue;
            if(newData[key] === undefined || newData[key] === null || !('bought' in newData[key]) || !('sold' in newData[key]) || !('bids' in newData[key]) || !('offers' in newData[key]))
                continue;
            newData[key].bought += history[key].bought;
            newData[key].sold += history[key].sold;
            newData[key].bids += history[key].bids;
            newData[key].offers += history[key].offers;
        }
    }
    if(max_time !== undefined )
    {
        newData[0] = {}
        newData[0].type = GetNextTierType(type)
        newData[0].time = max_time
        tradePostPricesDataHistory.unshift(newData)
    }
    RemoveAllExcessHistory(type);
}



function FetchTPPricesData()
{
    var date = Date.now()
    //consolelog("Fetching: " + (new Date()).toLocaleString('en-GB'))
	fetch(GetFetchStr(urlTPPrices, 0)).then(response => { return response.headers.get('X-Page-Total');}).then( totalPages =>
	{
        var promises = []
		for (i = 0; i < totalPages; i++) {
			promises.push(fetch(GetFetchStr(urlTPPrices, i)).then(response => {return response.json();}).then(json => 
			{
				for (var key in json) 
				{
					var k = json[key].id;
					tradePostPricesDataCurrent[k] = json[key];
					delete tradePostPricesDataCurrent[k].id
					delete tradePostPricesDataCurrent[k].whitelisted
				}
			}).catch((error) => {/*console.log(error)*/}));
		}
        //console.log("Promises: " + promises.length)   
        Promise.all(promises).then( fetchData => 
        { 
            if(tradePostPricesDataPrevious.length == 0)
            {
                //consolelog("Returned Init")        
                SaveCurrentToPrevious();
                return;
            }
            //console.log("Calculating") 
            var changed = false;
            var tradePostPricesDataDifference = [];
            for (var key in tradePostPricesDataCurrent) 
		    {
			    var currentData = tradePostPricesDataCurrent[key];
			    var prevData = tradePostPricesDataPrevious[key];
                if (prevData === undefined || prevData.buys === undefined || prevData.sells === undefined ||  currentData === undefined  || currentData.buys === undefined || currentData.sells === undefined)
                {
                    continue;
                }
                var bought = 0;
                if(prevData.buys.quantity > currentData.buys.quantity)
                    bought = prevData.buys.quantity - currentData.buys.quantity;
                var sold = 0;
                if(prevData.sells.quantity > currentData.sells.quantity)
                    sold = prevData.sells.quantity - currentData.sells.quantity;
                var bids = 0;
                if(prevData.buys.quantity < currentData.buys.quantity)
                    bids = currentData.buys.quantity - prevData.buys.quantity;
                var offers = 0;
                if(prevData.sells.quantity < currentData.sells.quantity)
                    offers =  currentData.sells.quantity - prevData.sells.quantity;
                var difference  = {}
                difference.id = key
                difference.bought = bought
                difference.sold = sold
                difference.bids = bids
                difference.offers = offers
                if(bought != 0 || sold != 0 || bids != 0 || offers != 0)
                    changed = true
                tradePostPricesDataDifference[key] = difference
		    }
            //consolelog("Base Calculating complete") 
            if(changed)
            {
                tradePostPricesDataDifference[0] = {}
                tradePostPricesDataDifference[0].type = "140"
                tradePostPricesDataDifference[0].time = date
                tradePostPricesDataHistory.unshift(tradePostPricesDataDifference)
                SaveData();
                CalcFinalData();   
                //console.log("Calculating result: " + tradePostPricesDataDifference.length)     
            }
            //console.log("Calculating End") 
            SaveCurrentToPrevious();
        }).catch((error) => {/*console.log(error)*/});
	}).catch((error) => {/*console.log(error)*/});
}

LoadSavedData();
FetchTPPricesData();
setInterval(() => { FetchTPPricesData();}, 1000 * 100);

setInterval(() => { ConvertExcessHistoryData('140');}, 1000 * 60 * 5);
setInterval(() => { ConvertExcessHistoryData('5min');}, 1000 * 60 * 60);
setInterval(() => { ConvertExcessHistoryData('1hour');}, 1000 * 60 * 60 * 24);
setInterval(() => { RemoveAllExcessHistory('1day');}, 1000 * 60 * 60 * 24 * 7);


//--------------------------------------------------------------------------------------------------------
//----------------------------------------Server----------------------------------------------------------
//--------------------------------------------------------------------------------------------------------
// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();

// our default array of dreams
const dreams = [
  "Find and count some sheep",
  "Climb a really tall mountain",
  "Wash the dishes"
];

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.raw({ limit: '50mb' }));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.send(JSON.stringify(tradePostPricesDataFinal))
});

app.post("/", (request, response) => {
  tradePostPricesDataFinal = request.body
  //console.log((new Date()).toLocaleString('en-GB') + " Recieved: " + tradePostPricesDataFinal.length + " - " + JSON.stringify(tradePostPricesDataFinal[19722]))
  response.send("Recieved: " + tradePostPricesDataFinal.length)
});

// listen for requests :)
const listener = app.listen(11000, () => {
  //console.log("Your app is listening on port " + listener.address().port);
});

//const fetch = require('node-fetch');
//fetch('https://api.guildwars2.com/v2/commerce/prices?page=1&page_size=200').then(response => response.json()).then(json => //console.log(json))
  
//--------------------------------------------------------------------------------------------------------
//-----------------------------------------Input----------------------------------------------------------
//--------------------------------------------------------------------------------------------------------

function SendHistory()
{
    fetch('http://84.238.211.36:11000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tradePostPricesDataFinal),
    })
    .then(response => response.text())
    .then(result => {
      //console.log("OK: " + result);
    }).catch(err => {})
}

var stdin = process.openStdin();

stdin.addListener("data", function(d) {
    var string =  d.toString().trim();
    if(string == 'send')
        SendHistory()
    //console.log("you entered: [" + string + "]");
  });

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

//Sends all the static files
app.use(express.static('public'));




var murder = {};
var rape = {};
var robbery = {};
var assault = {};
var burglary = {};
var larceny = {};
var vehicleTheft = {};


fs.createReadStream(__dirname+'/Index_Crimes_by_County_and_Agency__Beginning_1990.csv')
.pipe(csv())
.on('data', function(data) {
  try { //for each row of the csv file
    //console.log(data);

    let key = String(data.County +'-'+ data.Year);

    if(!key.includes("Region Total")) {
      //***Murder***
      let murderNum;
      if(data["Murder"] === "")
        murderNum = 0;
      else
        murderNum = parseInt(data["Murder"], 10);

      if(typeof murder[key] == "undefined")
        murder[key] = murderNum;
      else
        murder[key] += murderNum;

      //***Rape***
      let rapeNum;
      if(data["Rape"] === "")
        rapeNum = 0;
      else
        rapeNum = parseInt(data["Rape"], 10);

      if(typeof rape[key] == "undefined")
        rape[key] = rapeNum;
      else
        rape[key] += rapeNum;

      //***Robbery***
      let robberyNum;
      if(data["Robbery"] === "")
        robberyNum = 0;
      else
        robberyNum = parseInt(data["Robbery"], 10);

      if(typeof robbery[key] == "undefined")
        robbery[key] = robberyNum;
      else
        robbery[key] += robberyNum;

      //***Assault***
      let assaultNum;
      if(data["Aggravated Assault"] === "")
        assaultNum = 0;
      else
        assaultNum = parseInt(data["Aggravated Assault"], 10);

      if(typeof assault[key] == "undefined")
        assault[key] = assaultNum;
      else
        assault[key] += assaultNum;

      //***Burglary***
      let burglaryNum;
      if(data["Burglary"] === "")
        burglaryNum = 0;
      else
        burglaryNum = parseInt(data["Burglary"], 10);

      if(typeof burglary[key] == "undefined")
        burglary[key] = burglaryNum;
      else
        burglary[key] += burglaryNum;

      //***Larceny***
      let larcenyNum;
      if(data["Larceny"] === "")
        larcenyNum = 0;
      else
        larcenyNum = parseInt(data["Larceny"], 10);

      if(typeof larceny[key] == "undefined")
        larceny[key] = larcenyNum;
      else
        larceny[key] += larcenyNum;

      //***Motor Vehicle Theft***
      let vehicleTheftNum;
      if(data["Motor Vehicle Theft"] === "")
        vehicleTheftNum = 0;
      else
        vehicleTheftNum = parseInt(data["Motor Vehicle Theft"], 10);

      if(typeof vehicleTheft[key] == "undefined")
        vehicleTheft[key] = vehicleTheftNum;
      else
        vehicleTheft[key] += vehicleTheftNum;
    }
    //const items = Object.entries(murder)
    //console.log(items);

  }
  catch(err) {
    //handle err
  }
})
.on('end', function() {
  //some final operation
});

app.get('/get/:county/:year', (req, res) => {
  let county = req.params.county;
  let year = req.params.year;
  console.log("Request for crime statistics for "+county+" "+year);
  let key = String(county+"-"+year);

  let murderNum = murder[key];
  let rapeNum = rape[key];
  let robberyNum = robbery[key];
  let assaultNum = assault[key];
  let burglaryNum = burglary[key];
  let larcenyNum = larceny[key];
  let vehicleTheftNum = vehicleTheft[key];

  var data = [["Murder", murderNum], ["Rape", rapeNum], ["Robbery", robberyNum], ["Aggravated Assault", assaultNum], ["Burglary", burglaryNum], ["Larceny", larcenyNum], ["Motor Vehicle Theft", vehicleTheftNum]];
  /*var data = {
    "Murder" : murderNum,
    "Rape" : rapeNum,
    "Robbery" : robberyNum,
    "Aggravated Assault" : assaultNum,
    "Burglary" : burglaryNum,
    "Larceny" : larcenyNum,
    "Motor Vehicle Theft" : vehicleTheftNum
  }*/
  let newData = JSON.stringify(data);
  console.log(newData);
  res.send(newData);

  //handle request/ route handler
  //res.send('Hello World!!!!');
  //res.sendFile(path.join(__dirname+'/index.html'));
});

// PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

let latitud, longitud, zoom;
var ABI = [{ "constant": false, "inputs": [{ "name": "latitude", "type": "string" }, { "name": "longitude", "type": "string" }, { "name": "zoom", "type": "string" }], "name": "update", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "key", "type": "bytes32" }], "name": "getDieselValueForKey", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "quadKey", "type": "bytes32" }, { "name": "value", "type": "uint256" }], "name": "updatePrice", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "latitude", "type": "bytes32" }, { "indexed": true, "name": "longitude", "type": "bytes32" }, { "indexed": true, "name": "zoom", "type": "bytes32" }], "name": "newDieselQuery", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "price", "type": "uint256" }, { "indexed": true, "name": "key", "type": "bytes32" }], "name": "newDieselPrice", "type": "event" }];
var CONTRACT = "0xb4404ad462c9bf9281a9fa1b20eadc3e4078f38b";
var account = "0x11CEb8E3c1dfb3B80B8663f6826B744720cD8cD8";
var privateKey = "0x252F14D40531139AFF39883A5FD2E88B0C49644DD58F8BB4D9CFA6A3E5189CE8";

//var web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/698394268f7a4595af65c851f0050948"));
//Socket conection are necessary because HttpProvider don't support event listener
var web3 = new Web3(new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws'));
//console.log(web3);

const myContract = new web3.eth.Contract(ABI, CONTRACT);
//console.log(myContract);

/**
 * Triggers the method issued by the diesel upgrade event in the contract. 
 */
var throwUpdateEvent = function () {

  latitud = $("#latitud").val();
  longitud = $("#longitud").val();
  zoom = $("#zoom").val();

  //When using Infura and not a node of its own, the transaction must be signed before it is launched.
  var trans = myContract.methods.update(latitud, longitud, zoom);
  var encodedABI = trans.encodeABI();
  var tx = {
    from: account,
    to: CONTRACT,
    gas: 50000,
    data: encodedABI
  };

  web3.eth.accounts.signTransaction(tx, privateKey).then(signed => {
    var tran = web3.eth.sendSignedTransaction(signed.rawTransaction);
    /*
    tran.on('confirmation', (confirmationNumber, receipt) => {
      console.log('confirmation: ' + confirmationNumber);
    })
    */
    tran.on('transactionHash', hash => {
      console.log('hash update transaction: ', hash);
    })
    tran.on('receipt', receipt => {
      console.log('Receipt transaction: ', receipt);
    })
    tran.on('error', console.error);
  });

};//End throwUpdateEvent

var getDieselValueFromContract = function () {
  latitud = $("#latitud").val();
  longitud = $("#longitud").val();
  zoom = $("#zoom").val();

  var dieselValue;
  //Calculate key to this position
  var quadKey = latlng2quadkey(latitud, longitud, zoom);
  var key32 = web3.utils.asciiToHex(quadKey, 32);

  myContract.methods.getDieselValueForKey(String(key32)).call({ from: account }, (error, result) => {
    if (result == null || result == 0) {
      alert("Key not registered: ");
    }
    if (result > 0) {
      result = result / 1000;
      console.log("The Key already registered, the medium value of the diesel is: ", result);
      console.log("Checking to see if it's up to date...");
      //We collect all past events from newDieselPrice
      myContract.getPastEvents('newDieselPrice', {
        filter: { key: [key32] },
        fromBlock: 0,
        toBlock: 'latest'
      }, (error, events) => {
        //The last event that occurred will be in the newest mined block.
        web3.eth.getBlock(events[events.length - 1].blockNumber).then(block => {
          var oneDay = 1000 * 60 * 60 * 24;
          //We compare the timestamp of the block where the last transaction is located
          //If the block is more than 1 day old, we must update the record.
          if (block.timestamp <= (Date.now - oneDay)) {
            alert("The value is out of date, please launch a new transaction if you want to update it.")
          } else {
            alert("The Key was updated less than a day ago. The median value of diesel is: " + result + " EUR");
          }

        });//End getBlock()

      })//End getPastEvents()

    }
  });//End call getDieselValueForKey()
}

var updatePrice = function (key32, dieselValue) {

  console.log("Key without updating more than one day or without registering, updating...");

  //To the smart contract we pass to an integer, when we recover it, apply division /1000 to have the 3 decimal places. 
  dieselValue = Math.floor(dieselValue * 1000);
  //console.log("Diesel Value after floor: " , dieselValue);

  var updatePriceCall = myContract.methods.updatePrice(key32, dieselValue);
  var encodedABI = updatePriceCall.encodeABI();

  var tx = {
    from: account,
    to: CONTRACT,
    gas: 70000,
    data: encodedABI
  };

  web3.eth.accounts.signTransaction(tx, privateKey).then(signed => {
    var tran = web3.eth.sendSignedTransaction(signed.rawTransaction);
    tran.on('transactionHash', hash => {
      console.log('hash updatePriceCall: ', hash);
    })
    tran.on('receipt', receipt => {
      console.log('Receipt transaction updatePrice: ');
      console.log(receipt);
    })
    tran.on('error', "error signTransaction updatePrice" + console.error);
  });

};//End updateQuery()

window.addEventListener('load', function () {

  myContract.events.newDieselQuery({}, (error, data) => {
    if (error) {
      console.log("Error: " + error);
    } else {
      console.log("Received Event newDieselQuery");
      var latitude = parseFloat(web3.utils.hexToAscii(data.returnValues.latitude));
      var longitude = parseFloat(web3.utils.hexToAscii(data.returnValues.longitude));
      var zoom = parseFloat(web3.utils.hexToAscii(data.returnValues.zoom));
      var dieselValue;

      //Calculate key to this position
      var quadKey = latlng2quadkey(latitude, longitude, zoom);

      //AJAX to API
      var jqxhr = $.getJSON("https://servicios.elpais.com/el-tiempo/gasolineras.pl?quadkey=" + quadKey + "&type=GOA", function (gasData) {
        console.log(gasData);
        dieselValue = gasData.medianas[0];
        //console.log("Valor medio del gasoil de la zona: " + gasData.medianas[0]);

        //Quadkey to bytes32, necessary in smart contract
        var key32 = web3.utils.asciiToHex(quadKey, 32);
        console.log("quadKey Bytes32: ", key32);

        //Consultamos si el valor esta desactualizado con una fecha mayor o igual a un día
        myContract.methods.getDieselValueForKey(String(key32)).call({ from: account }, (error, result) => {
          if (result == null || result == 0) {
            console.log("Key no registrada: ", result);
            updatePrice(key32, dieselValue);
          }
          if (result > 0) {
            result = result / 1000;
            console.log("The Key already registered, the medium value of the diesel is: ", result);
            console.log("Checking to see if it's up to date...");

            //We collect all past events from newDieselPrice
            myContract.getPastEvents('newDieselPrice', {
              filter: { key: [key32] },
              fromBlock: 0,
              toBlock: 'latest'
            }, (error, events) => {
              //The last event that occurred will be in the newest mined block.
              web3.eth.getBlock(events[events.length - 1].blockNumber).then(block => {
                var oneDay = 1000 * 60 * 60 * 24;
                //We compare the timestamp of the block where the last transaction is located
                //If the block is more than 1 day old, we must update the record.
                if (block.timestamp <= (Date.now - oneDay)) {
                  updatePrice(key32, dieselValue);
                } else {
                  console.log("The Key was updated less than a day ago, so the value is valid.");
                  alert("The Key was updated less than a day ago, so the value is valid. Value: " + result + " EUR");
                }

              });//End getBlock()

            })//End getPastEvents()

          }
        });//End call getDieselValueForKey()

      }).fail(function (error) {
        console.log("AJAX Request error to get the price of Diesel, there may be no gas stations at those coordinates: ", error);
      }); //End getJSON AJAX

    }//End else

  });//End newDieselQuery

})//End addEventListener load
// Constants
const BitindexApiURL = "https://api.bitindex.network/api/v1/utxos/";
const BitDbApi = "https://babel.bitdb.network/q/1DHDifPvtPgKFPZMRSxmVHhiPvFmxZwbfh/";
const BitSocketApi = "https://babel.bitdb.network/s/1DHDifPvtPgKFPZMRSxmVHhiPvFmxZwbfh/";
const BitDbApiKey = "qzudnqxkd9mplr003rnzr83qmapnyf09yynescajl0";
const BitcomProtocol = "1BGUipRWPj63awCM2z5FkLJBWvg5iMf3uF";
const ColorDepth = "0x18" //24bit RGB
const MapSizeX = "0x0A"  //10bit X
const MapSizeY = "0x0A"  //10bit Y
const RoundCapacity = 16655; //max. pixels per tx op_return 99994bytes pixel=(10b|10b|8b|8b|8b)
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

var size = 4;
var drawingboard = ""
var addresses = []
addresses.push('17faLSy9ByvE3qZSLSScGgrZTZ5YUnVjde')

if(window.location.hash) {
  drawingboard = window.location.hash.slice(1);
}else{
  drawingboard = 'all';
}

var BitSocketQuery = ""
const BitSocketQuery_1 = {
"v": 3,
"q": {
  "find": {
    "out.s1": `${BitcomProtocol}`,
    "out.s5": `${drawingboard}`
  }
},
"r": {
  "f": "[.[] | .out[] | select(.b0.op? and .b0.op == 106) | {hexCode: (if .h6 then .h6 else .lh6 end)} ]"
  }
};

const BitSocketQuery_2 = {
"v": 3,
"q": {
  "find": {
    "out.s1": `${BitcomProtocol}`,
    "out.s5": `${drawingboard}`,
    "in.e.a": {
      "$in": addresses
     }
  }
},
"r": {
  "f": "[.[] | .out[] | select(.b0.op? and .b0.op == 106) | {hexCode: (if .h6 then .h6 else .lh6 end)} ]"
  }
};

var BitDbQuery = ""
const BitDbQuery_1 = {
"v": 3,
"q": {
  "find": {
    "out.s1": `${BitcomProtocol}`,
    "out.s5": `${drawingboard}`
  },
  "limit": 100000
},
  "r": {
    "f": "[.[] | .out[] | select(.b0.op? and .b0.op == 106) | {hexCode: (if .h6 then .h6 else .lh6 end)} ]"
  }
};
const BitDbQuery_2 = {
"v": 3,
"q": {
  "find": {
    "out.s1": `${BitcomProtocol}`,
    "out.s5": `${drawingboard}`,
    "in.e.a": {
      "$in": addresses
     }
  },
  "limit": 100000
},
  "r": {
    "f": "[.[] | .out[] | select(.b0.op? and .b0.op == 106) | {hexCode: (if .h6 then .h6 else .lh6 end)} ]"
  }
};

canvas.width = 1024;
canvas.height = 1024;

ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

let drawingMode = false;
let cX = 0;
let cY = 0;
let changingColor = 0; //color variable responsible for changing color
let direction = true; //changes the size of the brush
let pixelDict = {}
let color = {}


function sliderupdate(e){
  size = parseInt(e.value);
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function getBalance(address){
    var address = "qpy3cc67n3j9rpr8c3yx3lv0qc9k2kmfyud9e485w2";
    var url = BitindexApiURL +address;
    fetch(url).then(function(r) {
      return r.json()
    }).then(function(r) {
      console.log(r)
      document.getElementById("balance").innerHTML = r.data.balance + " satoshis";
    })
}

async function bitsocket(){
  var b64 = btoa(JSON.stringify(BitSocketQuery));
  var eventsource = BitSocketApi+b64
  var bitsocket = new EventSource(eventsource)

  bitsocket.onmessage = function(e) {
    let json = JSON.parse(e.data)
    console.log("Bitsocket:",json);
    if(json.type == 'u'){
      var hexCode = json.data[0]['hexCode']
      console.log("From Bitsocket mempool: ",hexCode)
      var pixel = getXYRGB(hexCode);
    } else if (json.type == 'c') {
      for(tx in json.data){
        var hexCode = json.data[tx][0]['hexCode']
        console.log("From Bitsocket block "+json.index+": ",tx, hexCode)
        var pixel = getXYRGB(hexCode);
      }
    }
  }
};

function bitdb(){
  console.log(BitDbQuery)

  var b64 = btoa(JSON.stringify(BitDbQuery));
  var url = BitDbApi + b64;

  console.log(url)

  var header = {
    headers: { key: BitDbApiKey }
  };

  fetch(url, header).then(function(r) {
    return r.json()
  }).then(function(r) {
    console.log("data:::",r);

    if(r['c'].length != 0){
      for(i in r['c']){
        var hexCode = r['c'][i]['hexCode']
        var pixel = getXYRGB(hexCode);
      }
    };

    if(r['u'].length != 0){
      for(i in r['u']){
        var hexCode = r['u'][i]['hexCode']
        var pixel = getXYRGB(hexCode);
      }
    };
  });
};

function switchMode(e){
  console.log("checket:",e.checked)
  if(e.checked){
    localStorage['mode'] = true;
  }else{
    localStorage['mode'] = false;
  }
  console.log(localStorage['mode'])
  location.reload();
}

function load(){
  console.log("mode: ",localStorage['mode'])
  document.getElementById("drawingboard").innerHTML = "Drawing board: " + drawingboard;

  if(localStorage['mode'] == 'false'){
    BitDbQuery = BitDbQuery_1
    BitSocketQuery = BitSocketQuery_1
  }else{
    BitDbQuery = BitDbQuery_2
    BitSocketQuery = BitSocketQuery_2
  }
  bitdb();
  bitsocket();
  getBalance();
}

function setColor(hex){
  [color[0],color[1],color[2]] = [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)]
};

function getXYRGB(hexCode){
  var pixelSize = 12 //hex
  if (hexCode.length >= pixelSize){
    var rounds = hexCode.length / pixelSize

    var startPos = 0
    for (count = 1; count <= rounds; count++){
      var endPos = startPos+pixelSize
      var pixel = hexCode.substring(startPos,endPos)
      startPos = endPos;

      var bin = pad(parseInt(pixel,16).toString(2),pixel.length*4)
      if (bin.length >= 48) {
        Y = parseInt(bin.substring(0,12),2)
        X = parseInt(bin.substring(12,24),2)
        R = parseInt(bin.substring(24,32),2)
        G = parseInt(bin.substring(32,40),2)
        B = parseInt(bin.substring(40,48),2)
        setPixel(R,G,B,X,Y,false);
      }
    };
  };
};

function roundUp(num, precision) {
  precision = Math.pow(10, precision)
  return Math.ceil(num * precision) / precision
};

let delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let sendOneTransaction = async function(oneMessage) {
  return new Promise(function(resolve, reject) {
    let pkey = document.getElementById('pkey').value;
    console.log('Now sending message:', oneMessage);
    let tx = {
      data: [BitcomProtocol,ColorDepth,MapSizeX,MapSizeY,drawingboard,"0x"+oneMessage],
      pay: {
        key: pkey,
        rpc: "https://api.bitindex.network"
      }
    };
    console.log(tx)
    datapay.send(tx, function(errorMessage, transactionId) {
      if (errorMessage) {
        console.log('Error sending message', oneMessage, ':', errorMessage);
        return reject(errorMessage);
      }
      else {
        console.log('Sent message', oneMessage, 'and got txid:', transactionId)
        return resolve(transactionId);
      }
    });
  })
};


async function send(pixelsToSend) {
  let pkey = document.getElementById('pkey').value;
  if(!pkey){
    console.log('No Privatekey set')
    return false
  }

  console.log("tosend:",pixelsToSend)

  var rounds = roundUp(pixelsToSend.length / RoundCapacity, 0)
  console.log("SendRounds:",rounds)

  var startPos = 0
  for (count = 1; count <= rounds; count++){
    console.log("SendRound:",count)
    var endPos = startPos+RoundCapacity
    var hexPayload = []
    var batch = pixelsToSend.slice(startPos,endPos)
    for (pixel in batch){
      var hexPixel = pad(parseInt(batch[pixel], 2).toString(16),12).toUpperCase();
      hexPayload.push(hexPixel)
    }

    hexPayload = hexPayload.join("")

    let txId;
    try {
      txId = await sendOneTransaction(hexPayload);
      console.log("try send tx!!!!!!",hexPayload)
    }
    catch(error) {
      console.log('There was an error in sending',hexPayload,':',error);
    }
    startPos = endPos;
  };
  let pixelDict = {};
};

function pixelArrayToBin(input){
  console.log("pixelArrayToBin: ",input)
  binCoordinates = []
  for (coordinate in input){
    splitCoordinate = coordinate.split("|")
    Y = pad((parseInt(splitCoordinate[0]) >>> 0).toString(2),12)
    X = pad((parseInt(splitCoordinate[1]) >>> 0).toString(2),12)
    R = pad((input[coordinate][0] >>> 0).toString(2),8)
    G = pad((input[coordinate][1] >>> 0).toString(2),8)
    B = pad((input[coordinate][2] >>> 0).toString(2),8)
    binCoordinates.push(Y+X+R+G+B)
  }
  return binCoordinates
}

function loadPixels(pixels){
 for (coordinate in pixels){
   splitCoordinate = coordinate.split("|")
   Y = splitCoordinate[0]
   X = splitCoordinate[1]
   R = pixels[coordinate][0]
   G = pixels[coordinate][1]
   B = pixels[coordinate][2]
   setPixel(R,G,B,X,Y,false);
 }
}

function keyPressed(e){
  var keyCode = e.which || e.keyCode;
  if(keyCode === 90){
    console.log("Pressed 'z' => Save to Local Storage")
    send(pixelArrayToBin(pixelDict));
  }
}

function toLocalStorage(){
  localStorage.pixel = JSON.stringify(pixelDict);
}

function click(e){
  [cX, cY] = [e.offsetX, e.offsetY];
  setPixel(color[0],color[1],color[2],cX,cY,true);
}

function draw(e) {
    [cX, cY] = [e.offsetX, e.offsetY];
    document.getElementById('coordinates').innerHTML =  cX + "|" + cY
    if (!drawingMode) return;
    setPixel(color[0],color[1],color[2],cX,cY,true);
}

function setPixel(r,g,b,cX,cY,isNew){
  var imagedata
  if(isNew){
    imagedata = ctx.createImageData(size,size);
    var pos = 0
    for (i = 0; i < size**2; i++){
      imagedata.data[pos] = r;
      imagedata.data[pos+1] = g;
      imagedata.data[pos+2] = b;
      imagedata.data[pos+3] = 255;
      pos = pos + 4
    }
  }else{
    imagedata = ctx.createImageData(1,1);
    imagedata.data[0] = r;
    imagedata.data[1] = g;
    imagedata.data[2] = b;
    imagedata.data[3] = 255;
  }

  ctx.putImageData(imagedata, cX, cY);

  if (isNew){
    for (i = 0; i < size; i++){
      for (a = 0; a < size; a++){
        coordinate = cY+"|"+cX
        pixelDict[coordinate] = [imagedata.data[0],imagedata.data[1],imagedata.data[2]]
        ++cX
      }
      ++cY
      cX = cX - size
    }
  }
}

document.addEventListener('keydown', keyPressed);
canvas.addEventListener('click', click);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mousedown', (e) => {
    drawingMode = true;
    setColor(document.getElementById('colorpicker').value);
});
canvas.addEventListener('mouseup', () => drawingMode = false);
canvas.addEventListener('mouseout', () => drawingMode = false);

window.onload = function() {
  load();
}

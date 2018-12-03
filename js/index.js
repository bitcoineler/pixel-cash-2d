const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;
canvas.width = 1024;
canvas.height = 1024;
ctx.strokeStyle = '#2196F3';
ctx.lineJoin = 'round';
ctx.lineCap = 'round';
ctx.lineWidth = 1;

let drawingMode = false;
let cX = 0; //X coordinate
let cY = 0; //Y coordinate
let changingColor = 0; //color variable responsible for changing color
let direction = true; //changes the size of the brush
let pixelDict = {}
let color = {}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function bitdb(){
  var query = {
  "v": 3,
  "q": {
    "find": {
      "out.h1": "8801"
    }
  },
    "r": {
      "f": "[.[] | .out[] | select(.b0.op? and .b0.op == 106) | {hexCode: .h2} ]"
    }
  };

  var b64 = btoa(JSON.stringify(query));
  var url = "https://bitdb.network/q/" + b64;

  console.log(url)

  var header = {
    headers: { key: "qzudnqxkd9mplr003rnzr83qmapnyf09yynescajl0" }
  };

  fetch(url, header).then(function(r) {
    return r.json()
  }).then(function(r) {
    console.log(r);

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
function setColor(R,G,B){
  [color[0],color[1],color[2]] = [R,G,B]
}

function getXYRGB(hexCode){
  var pixelSize = 12 //hex
  if (hexCode.length >= pixelSize){
    // console.log("HexCodeLenght:",hexCode.length)
    var rounds = hexCode.length / pixelSize
    // console.log("PixelRounds:",rounds)

    var startPos = 0
    for (count = 1; count <= rounds; count++){
      var endPos = startPos+pixelSize
      var pixel = hexCode.substring(startPos,endPos)
      // console.log("Count:",count, "Slice:",hexCode.substring(startPos,endPos))
      startPos = endPos;

      var bin = pad(parseInt(pixel,16).toString(2),pixel.length*4)
      if (bin.length >= 48) {
        Y = parseInt(bin.substring(0,12),2)
        X = parseInt(bin.substring(12,24),2)
        R = parseInt(bin.substring(24,32),2)
        G = parseInt(bin.substring(32,40),2)
        B = parseInt(bin.substring(40,48),2)
        // console.log("Bin:",bin, " Hex:",pixel)
        setPixel(R,G,B,X,Y,false);
      }
    };
  };
};

function roundUp(num, precision) {
  precision = Math.pow(10, precision)
  return Math.ceil(num * precision) / precision
}

// Enter a compressed private key here.
let pkey = document.getElementById('pkey').value;
// Payment address that the payments will be sent to.  I used the one
// associated with the above private key.
let cashAddress = '';

// Async-await compatible timeout function
let delay = ms => new Promise(resolve => setTimeout(resolve, ms));
// An async-await style function that makes a single
// datasend.call for the message supplied as the argument
let sendOneTransaction = async function(oneMessage) {
  // Returns a "promise" function that will pass
  // the results of datacash.send back to the
  // function that called sendOneTransaction.
  // In this case it's the send function
  // that gets executed when the button is pressed.
  return new Promise(function(resolve, reject) {
    console.log('Now sending message:', oneMessage);
    datacash.send({
      data: ["0x8801", oneMessage],
      cash: {
        key: pkey,
        fee: 250
        // to: [{
        //   address: cashAddress,
        //   value: 500
        // }]
      }
    }, function(errorMessage, transactionId) {
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
  console.log("tosend:",pixelsToSend)

  var roundCapacity = 36

  var rounds = roundUp(pixelsToSend.length / roundCapacity, 0)
  console.log("SendRounds:",rounds)

  var startPos = 0
  for (count = 1; count <= rounds; count++){
    var endPos = startPos+roundCapacity
    var hexPayload = []
    var batch = pixelsToSend.slice(startPos,endPos)
    for (pixel in batch){
      var hexPixel = pad(parseInt(batch[pixel], 2).toString(16),12).toUpperCase();
      hexPayload.push(hexPixel)
    }

    hexPayload = hexPayload.join("")
    console.log("payload:",hexPayload)

    let txId;
    try {
      txId = await sendOneTransaction(hexPayload);
    }
    catch(error) {
      console.log('There was an error in sending',hexPayload,':',error);
    }
    // Wait three seconds in between messages
    await delay(3000);
    startPos = endPos;
  }
};

// function send(pixelsToSend){
//   console.log("tosend:",pixelsToSend)
//   var pkey = document.getElementById('pkey').value
//   var prefix = "0x8801"
//   var roundCapacity = 36
//
//   var rounds = roundUp(pixelsToSend.length / roundCapacity, 0)
//   console.log("SendRounds:",rounds)
//
//   var startPos = 0
//   for (count = 1; count <= rounds; count++){
//     var endPos = startPos+roundCapacity
//     var hexPayload = []
//     var batch = pixelsToSend.slice(startPos,endPos)
//     for (pixel in batch){
//       var hexPixel = pad(parseInt(batch[pixel], 2).toString(16),12).toUpperCase();
//       hexPayload.push(hexPixel)
//     }
//
//     hexPayload = hexPayload.join("")
//     console.log("payload:",hexPayload)
//
//     var tx = {
//         data: [prefix,"0x"+hexPayload],
//         cash: { key: pkey }
//       }
//
//     datacash.send(tx, function(err, res) {
//             console.log("result",res);
//           if (err){
//             console.log(err);
//           };
//     });
//     startPos = endPos;
//   }
// }

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

function binToPixelArray(input){
  console.log("binToPixelArray: ",input)
  pixelArray = {}
  for (binCoordinate in input){
    binPixel = input[binCoordinate]
    Y = parseInt(binPixel.substring(0,10),2)
    X = parseInt(binPixel.substring(10,20),2)
    R = parseInt(binPixel.substring(20,28),2)
    G = parseInt(binPixel.substring(28,36),2)
    B = parseInt(binPixel.substring(36,44),2)

    coordinate = Y+"|"+X
    pixelDict[coordinate] = [R,G,B]
  }
  return pixelArray
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
    // toLocalStorage();
    var pixelsToSend = pixelArrayToBin(pixelDict)
    console.log(pixelsToSend);
    send(pixelsToSend);
  }
}

function toLocalStorage(){
  localStorage.pixel = JSON.stringify(pixelDict);
}

// function fromLocalStorage(){
//   try {
//     var pixelArray = JSON.parse(localStorage.pixel);
//   } catch {
//     var pixelArray = ""
//   }
//   return pixelArray
// }

function click(e){
  [cX, cY] = [e.offsetX, e.offsetY];
  setPixel(color[0],color[1],color[2],cX,cY,true);
}

function draw(e) {
    [cX, cY] = [e.offsetX, e.offsetY];
    document.getElementById('coordinates').innerHTML =  cX + "|" + cY
    if (!drawingMode) return;
    setPixel(color[0],color[1],color[2],cX,cY,true);

    // ctx.strokeStyle = `hsl(${changingColor}, 100%, 50%)`;
    // ctx.beginPath();
    // console.log("=>",cX,cY)
    // ctx.moveTo(cX, cY);
    // console.log("--",e.offsetX,e.offsetY)
    // ctx.lineTo(e.offsetX, e.offsetY);
    // ctx.stroke();
}

function setPixel(r,g,b,cX,cY,isNew){
  var imagedata = ctx.createImageData(1,1);

  imagedata.data[0] = r;
  imagedata.data[1] = g;
  imagedata.data[2] = b;
  imagedata.data[3] = 255;

  ctx.putImageData(imagedata, cX, cY);
  // console.log("SetPixel:","X:",cX,"Y:",cY,imagedata)
  coordinate = cY+"|"+cX
  if (isNew){
    pixelDict[coordinate] = [imagedata.data[0],imagedata.data[1],imagedata.data[2]]
  }
}

document.addEventListener('keydown', keyPressed);
canvas.addEventListener('click', click);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mousedown', (e) => {
    drawingMode = true;
    [cX, cY] = [e.offsetX, e.offsetY];
});
canvas.addEventListener('mouseup', () => drawingMode = false);
canvas.addEventListener('mouseout', () => drawingMode = false);

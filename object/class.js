var request = require('request');
var OFFSET = 5;
class Device {
    constructor(address) {
        this.address = address;
        this.data = {};
        this.status = "OK";
        this.info = {};
    }
    getAddress() {
        return this.address;
    }

    setAddress(address) {
        this.address = address;
        return "OK";
    }
}

class ESP extends Device {
    constructor(address) {
        super(address);
        this.type = "ESPD"

        this.temperature = 0;
        this.humidity = 0;
        this.moisture = 0;
        this.ec = 0;
        this.ph = 0;
        this.wind = 0;
    }
    uploadSensor(b) {
        try{
            this.temperature = b.DHT11.Temperature;
            this.humidity = b.DHT11.Humidity;
            
            this.moisture = Math.floor((parseInt(b.ADS1115.A0)*10000/65535))/100;
            this.ec = (Math.round(parseInt(b.ADS1115.A1) * 495000 / 65535)/100);
            this.ph = Math.round((parseInt(b.ADS1115.A2) * 5 / 65535)*3.5) + OFFSET;
            this.wind = Math.round(b.ADS1115.Wind*100);
            this.illuminance = b.BH1750.Illuminance;
        }catch(e){
            console.log("ERROR UPLOAD DATA: ", e)
        }
    }
    getData() {
        return {
            temperature: this.temperature,
            humidity: this.humidity,
            moisture: this.moisture,
            ec: this.ec,
            ph: this.ph,
            wind: this.wind, 
            illuminance: this.illuminance
        }
    }
    getDataVirtual() {
        return {
            temperature: Math.round(Math.random()*100),
            humidity: Math.round(Math.random()*100),
            moisture: Math.round(Math.random()*100),
            ec: Math.round(Math.random()*100),
            ph: Math.round(Math.random()*100),
            wind: Math.round(Math.random()*100)
        }
    }
    getTemperature() {
        return this.temperature;
    }
    action() {
        return new Promise((resolve, reject) => {
            request.get("http://" + this.address.host + ":" + this.address.port + "/data?sensor=1", function(error, response, body) {
                if (error) {
                    console.log('error:', error); // Print the error if one occurred
                    reject(error);
                }
                var b = body;
                try {
                    if (response.statusCode) {
                        if (response.statusCode == 200) {
                            resolve(JSON.parse(b));
                            console.log(b);
                        }
                    } else {
                        console.log("ERROR: query data");
                    }
                } catch (e) {
                    reject(e);
                }


            });
        })
    }

}

class PLC extends Device {
    constructor(address) {
        super(address);
        this.type = "PLCD";
        this.sn = "";
        this.objControlPlc = {
            "identifier": "PLC-123",
            "actionId": "12345",
            "type": "NONE",
            "on": "true",
            "time": "5"
        }
        // this.objControlPlc.type = type;
        this.delay = {};
    }
    setSeriesNumber(sn) {
        this.sn = sn;
    }
    action(type) {
        return new Promise((resolve, reject) => {
            this.objControlPlc.type = type;
            if (this.objControlPlc.type == undefined) {
                reject("ERROR")
                return;
            }
            // console.log("HERE");
            request.post("http://" + this.address.host + ":" + this.address.port + "/device", {
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(this.objControlPlc)
            }, function(error, response, body) {
                if (error) {
                    // console.log('error:', error); // Print the error if one occurred
                    reject(error);
                }
                try {
                    if (response.statusCode == 200) {
                        resolve(JSON.parse(body));
                    }
                } catch (e) {
                    reject(e);
                }

            });
        })
    }
    turnOFF(type) {
        console.log("TURN-OFF: ", this.objControlPlc.type)
        // this.status = "OFF_NORMAL"
        this.objControlPlc.on = "false";
        this.objControlPlc.time = 0;
        return this.action(type);
    }

    turnON(type) {
        // this.status = "ON_NORMAL"
        console.log("TURN-ON: ", type)
        this.objControlPlc.on = "true";
        this.objControlPlc.time = 0;
        return this.action(type);
    }
    toggleON(delay) {
        if (this.delay._idleTimeout > 0) {
            clearTimeout(this.delay);
        }
        this.delay = setTimeout(function(a) {
            // a.status = "OFF_NORMAL"
            a.objControlPlc.on = "false";
            a.objControlPlc.time = 0;
            return a.action();
        }, delay * 1000, this);
        // this.status = "ON_TOGGLE";
        return this.turnON(type);
    }
    toggleOFF(delay) {
        if (this.delay._idleTimeout > 0) {
            clearTimeout(this.delay);
        }
        this.delay = setTimeout(function(a) {
            // a.status = "ON_NORMAL"
            a.objControlPlc.on = "true";
            a.objControlPlc.time = 0;
            return a.action();
        }, delay * 1000, this);
        // this.status = "OFF_TOGGLE";
        return this.turnOFF();
    }
}

// var d2 = new PLC({host: "192.168.3.119", port: 3000}, "D2");
// var d1 = new PLC({host: "192.168.3.119", port: 3000}, "D1");
// d2.toggleON(0.2);
// d1.toggleON(3);
// var s = require("./classStrigger");
// var x = new s.Strigger();
// var x1 = new s.Strigger();
// var t = new s.RunTime("TEST");
// var j = 0;
// var k = 1;
// x.setValueUp(30, function(){
//     console.log("TURN-ON: ", j);
//     d1.turnON();
// });

// x.setValueDown(23, function(){
//     console.log("TURN-OFF: ", j);
//     d1.turnOFF();
// })

// x1.setValueUp(20, function(){
//     console.log("TURN-ON: ", j);
//     d2.turnON();
// });

// x1.setValueDown(45, function(){
//     console.log("TURN-OFF: ", j);
//     d2.turnOFF();
// })

// setInterval(function(){
//     console.log("J: ", j)
//     if(((j < 50) && (j >=0) && (k == 1))){
//         x.uploadData(j+=2);
//         x1.uploadData(j);
//         k = 1;
//     } else if ((j >= 50) || (k == 0)) {
//         j = j - 2
//         x.uploadData(j);
//         x1.uploadData(j);
//         k = 0;
//         if(j < 0){
//             j = 0; 
//             k = 1;
//         }
//     } else {
//         k = 1;
//     }
// }, 200);

// var e = new ESP({host: "192.168.0.13", port: 80});
// e.action().then((a)=>{
//     e.uploadSensor(a);
//     console.log(e.getTemperature());
// }).catch((a)=> {
//     // console.log(a);
// });

module.exports.ESP = ESP;
module.exports.PLC = PLC;
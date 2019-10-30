var request = require("request")
class ESP {
    constructor(address){
        this.address = address;
        this.sensor = {
            humidity: {
                disabled: false,
                data: ""
            },
            temperature: {
                disabled: false,
                data: ""
            },
            moisture: {
                disabled: false,
                data: ""
            }, 
            ec: {
                disabled: false,
                data: ""
            },
            illuminance: {
                disabled: false,
                data: ""
            },
            windSpeed: {
                disabled: false,
                data: ""
            }, 
            ph: {
                disabled: false,
                data: ""
            }
        }
    }
    appendSensor(obj){
        let i;
        for(i in obj){
            if(obj[i] == 1){
                // console.log(this.sensor[i], i)
                this.sensor[i].disabled = false;
            }
        }
    }
    uploadData(obj){
        let i;
        for(i in this.sensor){
            if(this.sensor[i].disabled == false) {
                this.sensor[i].data = obj[i];
            }
        }
    }
    getData(){
        var obj = {};
        let i;
        for(i in this.sensor){
            obj[i] = this.sensor[i].data;
        }
        return obj;
    }
    checkSensor(sensor){
        return !this.sensor[sensor].disabled;
    }
    /* GET DATA FROM ESP DEVICE */
    action(){
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
                            // console.log("DATA:",b);
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
    sync(cb){
        let data = this.action().then((a)=>{
            console.log(a);
            let obj = {
                temperature: a.DHT11.Temperature,
                humidity: a.DHT11.Humidity,
                moisture: a.ADS1115.Moisture,
                ec: a.ADS1115.EC,
                ph: a.ADS1115.pH,
                windSpeed: a.ADS1115.Wind,
                illuminance: a.BH1750.Illuminance
            }
            console.log(this.address,obj);
            this.uploadData(obj);
            if(cb){
                cb(this.getData());
            }
            
            // console.log(this.address,obj);
        }).catch((e)=>{
            console.log("ERROR:", "System cannot sync", e)
        })
        // console.log(data)
    }
}

// var e = new ESP({host: "192.168.10.104", port: 80});
// let obj = {
//     temperature: true,
//     humidity: true,
//     moisture: true,
//     ec: true,
//     ph: true,
//     windSpeed: true,
//     illuminance: true
// }
// e.appendSensor(obj);
// e.action().then((a)=>{
//     let obj = {
//         temperature: a.DHT11.Temperature,
//         humidity: a.DHT11.Humidity,
//         moisture: a.ADS1115.Moisture,
//         ec: a.ADS1115.EC,
//         ph: a.ADS1115.pH,
//         windSpeed: a.ADS1115.Wind,
//         illuminance: a.BH1750.Illuminance
//     }
//     // console.log("OBJ:", obj)
//     e.uploadData(obj);
//     console.log("DATA:", e.getData());
// }).catch((e)=>{
//     console.log("ERROR:", "System cannot sync", e)
// })

module.exports.ESP = ESP;
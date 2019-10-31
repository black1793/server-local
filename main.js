var fs = require('fs');
var request = require("request")
var express = require('express');
var bodyParser = require('body-parser');
var mysql = require("./classMysql-v2");
var cors = require('cors');

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
var object_define = JSON.parse(fs.readFileSync('element.json', 'utf8'));

var mqtt = require('mqtt')
// var clientMqtt  = mqtt.connect('mqtt://localhost')
// var clientMqtt  = mqtt.connect('mqtt://cretabase.kbvision.tv')
var clientMqtt = mqtt.connect('mqtt://broker.hivemq.com');
clientMqtt.on('connect', function () {
    clientMqtt.subscribe('/esp', function (err) {
        if (!err) {
            clientMqtt.publish('/esp', 'Hello mqtt');
        }
    });
})


/* 
    DEVICE CONFIG TO SERVER
*/
var esp = require("./object/esp");
var plc = require("./object/plc")

//==========================================================================================
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.get("/", function(req, res) {
    res.render("index", {
        mainPage: "index",

    });
});



app.get("/object", function(req, res) {
    res.send({
        status: "ERROR",
        data: "CANNOT FOUND OBJECT, YOU CAN DEFINE BEFORE USING",
    })
})
app.get("/object/:obj", function(req, res) {
    if ((object_define.object[req.params.obj] == undefined) || (req.params.obj == undefined)) {
        res.send({
            status: "ERROR",
            data: "CANNOT FOUND OBJECT, YOU CAN DEFINE BEFORE USING",
        });
    } else {
        res.render("element", {
            mainPage: req.params.obj,
            form: object_define.object[req.params.obj].element,
            title: object_define.object[req.params.obj].element
        });
    }
});

app.post("/insert/:table", function(req, res) {
    var a = req.body;
    mysql.connect2query(object_define.database[object_define.object[req.params.table].database], mysql.object2query(a, a, req.params.table)).then((a) => {
        res.render("back")
    }).catch((e) => {
        res.send({
            status: "ERROR",
            data: e
        })
    })
});

app.post("/insertid/:table", function(req, res) {
    var a = req.body;
    mysql.connect2query(object_define.database[object_define.object[req.params.table].database], mysql.object2query(a, a, req.params.table)).then((a) => {
        res.send({
            status: "OK",
            data: {
                id: a.insertId
            }
        })
    }).catch((e) => {
        console.log(e)
        res.send({
            status: "ERROR",
            data: e
        })
    })
});

app.get("/table", function(req, res) {
    var a = req.query;
    console.log(a.table);
    if (a.c1 == undefined) {
        mysql.connect2query(object_define.database[object_define.object[a.table].database], "select * from " + a.table).then((a) => {
            res.send({
                status: "OK",
                data: a
            });
        }).catch((e) => {
            console.log(e);
            res.send({
                status: "ERROR",
                error: e.code
            })
        })
    } else {
        mysql.connect2query(object_define.database[object_define.object[a.table].database], "select * from " + a.table + " where " + a.c1 + "='" + a.v1 + "'").then((a) => {
            res.send({
                status: "OK",
                data: a
            });
        }).catch((e) => {
            console.log(e);
            res.send({
                status: "ERROR",
                error: e.code
            })
        })
    }

})

app.put("/update", function(req, res) {
    var a = req.body;
    console.log("HERE ==> ", a);
    mysql.connect2query(object_define.database[object_define.object[a.table].database], mysql.update2query("id" + a.table, a.data["id" + a.table], a.table, a.data)).then((a) => {
        console.log(a);
        res.send({
            status: "OK",
            data: ""
        })
        clearInterval(timeInterval);
        orignal();
    }).catch((e) => {
        console.log(e)
        res.send({
            status: "ERROR",
            data: ""
        })
    })
})

app.get("/delete", function(req, res) {
    var a = req.query;
    console.log(a);
    mysql.connect2query(object_define.database[object_define.object[a.table].database], mysql.delete2query("id" + a.table, a.id, a.table)).then((a) => {
        res.send({
            status: "OK",
            data: ""
        })
    }).catch((e) => {
        res.send({
            status: "ERROR",
            data: "e"
        })
    })
});

app.get("/value", function(req, res){
    var a = req.query;
    for(i in aESP){
        if(aESP[i].id == a.idsensor){
            let obj = [];
            let value = aESP[i].esp.getData();
            console.log(value);
            for(i in value){
                obj.push({
                    key: i,
                    value: value[i]})
           }
            
            res.send({
                status: "OK",
                data: obj
            })
            return;
        }
    }
    res.send({
        status: "ERROR",
        data: "",
    })
})

app.get("/device", function(req, res) {
    var a = req.query;
    console.log(a);
    if (a.control && a.device) {
        for (i in aPLC) {
            if (aPLC[i].id == a.device) {
                if (a.control == 1) {
                    aPLC[i].plc.turnON();
                } else if (a.control == 0) {
                    aPLC[i].plc.turnOFF();
                } else {

                }

                res.send({
                    status: "OK",
                    data: {
                        device: a.device,
                        control: a.control
                    }
                })
                return;
            }
        }
        res.send({
            status: "ERROR",
            data: {
                device: a.device,
                control: a.control
            },
            error: "CANNOT FOUND DEVICE IN SERVER CONTROL"
        })
    }
    res.send({
        status: "ERROR",
        data: {
            device: a.device,
            control: a.control
        },
        error: "CANNOT CONTROL"
    })
})

function controlDeviceControl(obj){
    console.log("CONTROL:", obj.data);
    for(i in aPLC){
        let ctrl = obj.data[aPLC[i].note];
        if(ctrl == "UP"){
            aPLC[i].plc.turnON();
        } else if (ctrl == "DOWN") {
            aPLC[i].plc.turnOFF();
        } else {
            console.log("CONTROL-NORMAL");
        }
        
    }
}

var aESP = [];
var aPLC = [];
var o_config_database = {};
var timeInterval = 0;
function begin() {
    mysql.connect2query(object_define.database[object_define.object["sensor"].database], "select * from sensor").then((a) => {
        for (i in a) {
            aESP.push({
                id: a[i].idsensor,
                esp: new esp.ESP({
                    host: a[i].host,
                    port: a[i].port
                })
            });
        }
        timeInterval = setInterval(setSensor, parseInt(o_config_database.timer)*1000);
        setInterval(setSensorAutoLoad, AULOADVALUE);
    }).catch((e) => {
        console.log("ERROR-ESP:", e);
    })
    mysql.connect2query(object_define.database[object_define.object["device"].database], "select * from device").then((a) => {
        for (i in a) {
            console.log({
                host: a[i].host,
                port: a[i].port
            }, a[i].note);
            aPLC.push({
                id: a[i].iddevice,
                plc: new plc.PLC({
                    host: a[i].host,
                    port: a[i].port
                }, a[i].note),
                note: a[i].note
            });
        }
        // for (i in aPLC) {
        //     // console.log(aPLC[i])
        //     aPLC[i].plc.turnOFF();
        // }
    }).catch((e) => {
        console.log("ERROR-PLC", e);
    })
}

function orignal(){
    aESP = [];
    aPLC = [];
    o_config_database = {};
    mysql.connect2query(object_define.database[object_define.object["config_system_cr"].database], "select * from config_system_cr").then((a) => {
        console.log(a);
        for(i in a){
            o_config_database[a[i].cr_key] = a[i].cr_value;
        }
        console.log("VARIABLE" ,o_config_database);
        begin();
    }).catch((e) => {
        console.log("ERROR-ESP:", e);
    })
}

orignal();

function setSensor() {
    console.log("UPSENSOR")
    for (i in aESP) {
        aESP[i].esp.sync(beginSuccess);
    }
}

var AULOADVALUE = 2000;
function setSensorAutoLoad() {
    console.log("326","UPSENSOR")
    for (i in aESP) {
        aESP[i].esp.sync();
    }
    clientMqtt.publish('/esp', JSON.stringify(aESP));
}

function insertHistory(obj){
    mysql.connect2query(object_define.database[object_define.object["history"].database], mysql.object2query(obj, obj, "history")).then((a) => {
        console.log("update-completed")
    }).catch((e) => {
        console.log("UPDATE:", e)
    })
}

/* UPLOAD TO SERVER-HISTORY BUT SAVE TO HISTORY */
function uploadHistory(obj, cb){
    obj.esps[0].pH = obj.ph;
    obj.esps[0].eC = obj.ec;
    console.log("CHECK: ", JSON.stringify(obj))

    request.post("https://farm-iot.herokuapp.com/api/v1/status", {
        headers: {
            'content-type': 'application/json',
            'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZDllOWI3Yjk4NGIyMTBiMTBhYzhmYjAiLCJpYXQiOjE1NzEwMjQ1MDUsImV4cCI6MTU3MTg4ODUwNX0.pFSM0hyMrznvrDPm2aDwS3D1q5Yc21wQjORACH7S5qk'
        },
        body: JSON.stringify(obj)
    }, function(error, response, body) {
        if (error) {
            console.log('error:', error); // Print the error if one occurred
            if (cb) {
                cb("ERROR")
            }
            insertHistory(obj);
            //return "ERROR";
        } else {
            console.log("connect success history server")
        }

        if (response.statusCode == 200) {
            if (cb) {
                cb(JSON.parse(body))
                
            }
return;
            let code = JSON.parse(body).result.actionCode;
            aHistory[code].object.completed = 1;
            delete aHistory[code].object['ID'];
            insertHistory(aHistory[code].object);
            console.log("SUCCESS ===>",body);
        } else {
            console.log("WARNING", body);
        }
    });
}

var aHistory = {};
function processData(data){
    controlDeviceControl(data);
    /* CREATE HISTORY */
    aHistory[data.code].object = {
        ID: "",
        actionCode: "",
        status: "",
        systemId: "",
        actions: "",
        humidity: "",
        temperature: "",
        illuminance: "",
        moisture: "",
        ec: "",
        ph: "",
        windSpeed: "",
	esps: []
    }
    for(i in aHistory[data.code].data){
        aHistory[data.code].object[i] = aHistory[data.code].data[i];
    }
    aHistory[data.code].object.esps = aHistory[data.code].esps;
    aHistory[data.code].object.esps[0].esp_id = 1;
    aHistory[data.code].object.esps[0].esp_name = "esp_test";
    aHistory[data.code].object.ID = "DEVICE-1793";
    aHistory[data.code].object.systemId = "5d9464f9c0cb3a01ac8ea793";
    aHistory[data.code].object.status = "SUCCESS";
    aHistory[data.code].object.actionCode = data.code;
    aHistory[data.code].object.actions = [];
    console.log("DATA", data);
    for(i in data.data){
        aHistory[data.code].object.actions.push({
            name: i,
            status: data.data[i]
        })
    }
    // aHistory[data.code].object.actionName = "["  
    uploadHistory(aHistory[data.code].object, function(a){
        console.log("STATUS-UPLOAD:", a);
    });
}

var check_auto = true;
function beginSuccess(a, cb){
    if(check_auto != true){
        return;
    }
    var obj = {
        idsensor: 1,
        data: a,
        code: (new Date()).getTime()
    }
    aHistory[obj.code] = {};
    aHistory[obj.code]["data"] = obj.data;
    aHistory[obj.code]["esps"] = [];
    aHistory[obj.code]["esps"].push(obj.data); 
   request.post("http://localhost:9000/check", {
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(obj)
    }, function(error, response, body) {
        if (error) {
            console.log('error:', error); // Print the error if one occurred
            if (cb) {
                cb("ERROR")
            }
            return "ERROR";
        }
        if (response.statusCode == 200) {
            if (cb) {
                cb(JSON.parse(body))
            }
            processData(JSON.parse(body));
            console.log("BOSY", body);
        }
    });
}

app.get("/auto", function(req, res){
    let a = req.params;
    console.log(a);
    if(a.data == 1){
        check_auto = true;
    } else {
        check_auto = false;
    }
})

app.get("/sensor", function(req, res) {
    var a = req.query;
    console.log(a);
    for (i in aESP) {
        if (aESP[i].id == a.idsensor) {
            res.send({
                status: "OK",
                data: aESP[i].esp.getData()
            })
            return;
        }
    }
    res.send({
        status: "ERROR",
        data: "",
        error: "CANNOT SUPPORT SENSOR"
    })
})


app.get("/sdevice", function(req, res){
	var a = req.query;
	console.log(a);
	for(i in aPLC){
		if(aPLC[i].id == a.idplc) {
		     aPLC[i].plc.status(function(d){
			mysql.connect2query(object_define.database[object_define.object['device'].database], "select * from device").then((a) => {
                    for(j in a){
			console.log("J:", a[j]);
                        let k = a[j].note.split("D")[1];
                        a[j].status = d["state" + k];
                    }
                    res.send({
                        status: "OK",
                        data: a
                    });
                }).catch((e) => {
                    console.log(e);
                    res.send({
                        status: "ERROR",
                        error: e.code
                    })
                })	
			})
		}
	}
})
app.listen(config.port);

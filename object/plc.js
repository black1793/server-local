var request = require('request');
class PLC {
    constructor( address, type){
        this.address = address;
        this.obj = {
            identifier: "PLC-123",
            actionId: "",
            type: type,
            on: false,
            time: 9,
        }
    }
    status(cb){
	request.get("http://" + this.address.host + ":" + this.address.port + "/stateDevice", function(e, r, b){
	    if(e){
                console.log("ERROR", e);
                if(cb){cb("ERROR")}
		return "ERROR";
	    }
	    if(r.statusCode == 200){
		if(cb){
                	cb(JSON.parse(b));
			return;
		} else {
			
		}
            }
	})
    }
    action(status, cb){
        // this.obj.type = device;
        this.obj.on = status;
        request.post("http://" + this.address.host + ":" + this.address.port + "/device", 
        {
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(this.obj)
        }, function (error, response, body) {
            if(error){
                console.log('error:', error); // Print the error if one occurred
                if(cb){
                    cb("ERROR")
                    return "ERROR";
                }
            }
            if(response.statusCode == 200) {
                if(cb){
                    cb(JSON.parse(body))
                }
            }
        });
    }
    turnON(){
        this.obj.time = 0;
        this.action("true", function(e){
            console.log(e);
        });
    }
    turnOFF(){
        this.obj.time = 0;
        this.action("false", function(e){
            console.log(e);
        });
    }
}

module.exports.PLC = PLC;

function changeButton(id, text){
    jQuery(id).text(text);
}

function changeON(id){
    changeButton(id, "ON");
}

function changeOFF(id){
    changeButton(id, "OFF");
}
var app = angular.module("api", []);
app.controller("plc", function($scope, $http, $interval, $timeout) {
    $scope.devices;
    $http.get("/table?table=device").then((a)=>{
        console.log(a);
        $scope.devices = a.data.data;
    }).catch((e)=>{
        console.log(e);
    });
    $scope.controlDevice = function(id){
        var control = "";
        if(jQuery("#btn-" + id).text() == "ON"){
            control = 1;
        } else if(jQuery("#btn-" + id).text() == "OFF"){
            control = 0;
        } else {
            console.log("Cannot type button to control")
            return;
        }
        $http.get("/device?device=" + id + "&control=" + control).then((a)=>{
            if(a.data.status == "OK"){
                if(a.data.data.control == 1){
                    jQuery("#btn-" + a.data.data.device).text("OFF")
                } else {
                    jQuery("#btn-" + a.data.data.device).text("ON")
                }
                
            }
        })
    }
});

var sensor = ["humidity", "temperature", "ec", "ph", "windSpeed", "moisture", "illuminance"];
app.controller("esp", function($scope, $http, $interval, $timeout) {
    $scope.sensors;
    $scope.s_sensor = sensor;
    $scope.v_sensors = [];
    $timeout(function(){
        $http.get("/value?idsensor=1").then((a)=>{
            $scope.v_sensors = a.data.data;
            console.log($scope.v_sensors);
        }).catch((e)=>{
    
        })
    }, 2000);
    $interval(function(){
        $http.get("/value?idsensor=1").then((a)=>{
            $scope.v_sensors = a.data.data;
            console.log($scope.v_sensors);
        }).catch((e)=>{
    
        })
    }, 3000)
    
});
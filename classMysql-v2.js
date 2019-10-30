var mysql = require('mysql');
let con1 = {
    host     : '192.168.3.119',
    user     : 'xtek',
    password : 'asrkpvg7',
    database : 'riod'
  };

/*
    CONNECT WHEN CONTROL
*/
function connect(obj){
  let obj1 = {
      host: "",
      user: "",
      password: "",
      database: ""
  }
  if(obj){
      for(i in obj1){
          if(obj[i] == undefined){
              return new Promise((y, n) => {
                  n("Define all infor");
              })
          }
      }
  } else {
      return new Promise((y, n) => {
          n("Define connection obj");
      })
  }
  let con = mysql.createConnection(obj);
  return new Promise((resolve, reject) => {
     con.connect(function(err) {
          if (err) return reject(err);
          resolve(con);
      });                
  });
}

function query(connection, sql){
    return new Promise((resolve, reject) => {
        connection.query(sql, function (err, result) {
            connection.end();
            if (err) reject(err);
            else
                resolve(result);
            });    
    });
    
}
/* 
    INPUT   :   obj, table, value
    RETURN  :   sql-query
*/
function object2query(object, value, table_name){
    var sql = "insert into " + table_name + " ";
    var ssql = ['', ''];
    for(i in object){
        if(value[i] != undefined){
            if(ssql[0].length > 0){
                ssql[0] += ", ";
                ssql[1] += ", ";
            }
            // ssql[0] = ssql[0] + "'" + i + "'";
            ssql[0] += i;
            ssql[1] = ssql[1] + "'" + value[i] + "'";
        }
    }
    // console.log(ssql);
    return sql + "("+ssql[0]+") " + "values (" + ssql[1]+ ")";
}


function update2query(condition1, value_condition1, table, object){
    var sql = "UPDATE " + table + " SET ";
    var sup = "";
    for(i in object){
        if(sup.length > 0){
            sup += ","
        }
        sup = sup + i + "='" + object[i] + "' ";
    }
    sql = sql + sup + "WHERE " + condition1 + "=" + value_condition1;
    console.log(sql);
    return sql;
}

function delete2query(condition1, value_condition1, table_name){
    var sql = "DELETE FROM " + table_name + " WHERE " + condition1 + " = " + value_condition1;
    return sql;
}

function connect2query(conn, sql){
    console.log(sql)
    return new Promise((resolve, reject) => {
        connect(conn).then((connection) => {
            query(connection, sql).then((data)=>{
                resolve(data);
            }).catch((e)=>{
                reject(e);
            })
        }).catch((e)=>{
            reject(e);
        })
    })
}
// connect(con1).then((conn)=>{
//     query(conn, update2query("idsensor", "124","sensor" , {
//         host_address: "192.168.0.13",
//         port_address: 80
//     })).then((a)=>{
//         console.log(a);
//     }).catch((e)=>{
//         console.log(e);
//     })
// })
module.exports.query = query;
module.exports.connect = connect;
module.exports.object2query = object2query;
module.exports.update2query = update2query;
module.exports.delete2query = delete2query;
module.exports.connect2query = connect2query;
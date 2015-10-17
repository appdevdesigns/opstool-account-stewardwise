/**
 * AccountController
 *
 * @description :: Server-side logic for managing Accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var fs = require('fs');
var path = require('path');

var transactionFixtureData = null;
var periodFixtureData = null;

module.exports = {
	
    _config: {
        model: "account",
        actions: true,
        shortcuts: true,
        rest: true
    },
    
    transaction:function(req, res){
        if (transactionFixtureData == null){
            
            var pathToFile = path.join(__dirname, "..", "..", "test", "fixtures", "Transaction.json");
            fs.readFile(pathToFile, {encoding:'utf8'}, function(err, data){ 
                
                if (err) {
                    res.serverError(err);
                } else {
                    transactionFixtureData = JSON.parse(data);
                    res.send(transactionFixtureData);
                }
            })
            
        } else {
            res.send(transactionFixtureData);
        }
    },
    
    period:function(req, res){
        if (periodFixtureData == null){
            
            var pathToFile = path.join(__dirname, "..", "..", "test", "fixtures", "Period.json");
            fs.readFile(pathToFile, {encoding:'utf8'}, function(err, data){ 
                
                if (err) {
                    res.serverError(err);
                } else {
                    periodFixtureData = JSON.parse(data);
                    res.send(periodFixtureData);
                }
            })
            
        } else {
            res.send(periodFixtureData);
        }
    }
};


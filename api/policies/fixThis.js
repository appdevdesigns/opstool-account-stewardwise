var AD = require('ad-utils');

module.exports = function(req, res, next) {
    AD.log();
    AD.log('<red> !!!!! Hey, remember to fix the permissions for this path before you publish it! </red>');
    AD.log('<red> Make sure you secure this route: </red><yellow>['+req.url+']</yellow><red> ! </red>');
    AD.log();
    next();
};
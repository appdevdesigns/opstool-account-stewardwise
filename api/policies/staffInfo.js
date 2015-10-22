var AD = require('ad-utils');

module.exports = function(req, res, next) {
    
    var guid = req.user.GUID();
    
    // For testing only
    // !! DISABLE THIS IN PRODUCTION !!
    console.log('REMEBER TO DISABLE GUID OVERRIDE IN staffInfo.js');
    if (req.param('guid')) {
        guid = req.param('guid');
    }
    
    // Fetch the staff's nssren data
    LNSSRen.findByViewerGUID({ viewerGUID: guid })
    .fail(function(err) {
        next(err);
    })
    .done(function(data) {
        if (data && data[0]) {
            req.stewardwise = req.stewardwise || {};
            req.stewardwise.nssren = data[0];
            next();
        } else {
            res.AD.error(new Error('Staff data not found'));
        }
    });
};
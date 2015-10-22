/**
 * AccountController
 *
 * @description :: Server-side logic for managing Accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var fs = require('fs');
var path = require('path');

module.exports = {
	
    _config: {
        model: "account",
        actions: true,
        shortcuts: true,
        rest: true
    },
    
    
    /**
     * GET /opstool-account-stewardwise/account/transaction
     */
    transaction: function(req, res) {
        var results = [];
        var glCodes = {
        /*
            <gl code>: "description",
            ...
        */
        };
        var periods = [];
        var account = req.stewardwise.nssren.account_number.replace(/\D/g, '');
        var nssrenID = req.stewardwise.nssren.nssren_id;
        
        var requestedPeriod = req.param('period');
        if (requestedPeriod && !requestedPeriod.match(/^\d\d\d\d\d\d$/)) {
            requestedPeriod = null;
        }
        
        async.auto({
            
            // Step 1A
            'getPeriods': function(next) {
                if (requestedPeriod) {
                    // Use the requested period
                    periods.push(requestedPeriod);
                    next();
                } else {
                    // Use the recent 12 periods
                    LNSSCoreAccountHistory.recent12Periods()
                    .fail(function(err) { next(err); })
                    .then(function(data) {
                        for (var i=0; i<data.length; i++) {
                            periods.push(data[i].yyyymm);
                        }
                        next();
                    });
                }
            },
            
            // Step 1B
            'getCodes': function(next) {
                LNSSCoreChartOfAccounts.find()
                .fail(function(err) { next(err); })
                .then(function(list) {
                    for (var i=0; i<list.length; i++) {
                        var code = list[i].chartofaccounts_accountNum;
                        var desc = list[i].chartofaccounts_description;
                        glCodes[code] = desc;
                    }
                    next();
                });
            },
            
            // Step 2
            'getTransactions': ['getPeriods', 'getCodes', function(next) {
                LNSSCoreGLTrans.byAccount(periods, account)
                .fail(function(err) { next(err); })
                .then(function(transactions, byPeriod) {
                    var data = transactions[account];
                    if (data && data.length) {
                        for (var i=0; i<data.length; i++) {
                            results.push({
                                id: data[i].id,
                                period: data[i].period,
                                date: data[i].date,
                                description: data[i].desc,
                                credit: data[i].income,
                                debit: data[i].expenses,
                                type: glCodes[data[i].code] || data[i].code
                            });
                        }
                    }
                    next();
                });
            }],
            
            // Step 3
            'currentPeriod': [function(next) {
                LNSSRen.currentTransactions({ nssrenID: nssrenID })
                .fail(function(err) { next(err); })
                .done(function(data) {
                    if (data) {
                        for (var type in data) {
                            for (var i=0; i<data[type].length; i++) {
                                data[type][i].period = '9999-current';
                                results.push( data[type][i] );
                            }
                        }
                        next();
                    } else {
                        next(new Error('Staff data not found'));
                    }
                });
            }],

            // Step 4
            'sort': ['getTransactions', 'currentPeriod', function(next) {
                results.sort(function(a, b) {
                    // Descending order by period, then date
                    if (a.period == b.period) {
                        return b.date - a.date;
                    } 
                    else {
                        return b.period - a.period;
                    }
                });
                next();
            }]
        
        }, function(err) {
            if (err) {
                res.AD.error(err);
            } else {
                res.AD.success(results);
            }
        });
    },
    
    
    
    /**
     * GET /opstool-account-stewardwise/account/period
     */
    period: function(req, res) {
        
        var results = [
        /*
            { ... },
            { ... },
            ...
        */
        ];
        
        var periods = [];
        var account = req.stewardwise.nssren.account_number.replace(/\D/g, '');
        var resultsByPeriod = {
        /*
            <period1>: { ... },
            <period2>: { ... },
            ...
        */
        };
        
        var nssren = req.stewardwise.nssren;
        var currentPeriod = nssren.nssren_balancePeriod.replace('-', '');
        var currentBalance = nssren.nssren_ytdBalance;
        var currentTransactions = [];
        
        async.auto({
            
            // Step 1
            'periods': 
            function(next) {
                LNSSCoreAccountHistory.recent12Periods()
                .fail(function(err) { next(err); })
                .then(function(data) {
                    for (var i=0; i<data.length; i++) {
                        periods.push(data[i].yyyymm);
                    }
                    next();
                });
            },
            
            // Step 2A
            'balances': ['periods', 
            function(next) {
                LNSSCoreAccountHistory.balanceForPeriods(periods, account)
                .fail(function(err) { next(err); })
                .then(function(data) {
                    var history = data[account];
                    for (var period in history) {
                        var balance = history[period];
                        resultsByPeriod[period] = resultsByPeriod[period] || {};
                        resultsByPeriod[period].balance = balance;
                    }
                    next();
                });
            }],
            
            // Step 2B
            'history': ['periods', 
            function(next) {
                LNSSCoreGLTrans.byAccount(periods, account)
                .fail(function(err) {next(err); })
                .then(function(transactions, byPeriod) {
                    var data = byPeriod[account];
                    for (var period in data) {
                        resultsByPeriod[period] = resultsByPeriod[period] || {};
                        resultsByPeriod[period].date = data[period].date;
                        resultsByPeriod[period].income = data[period].income.toFixed(2);
                        resultsByPeriod[period].expenses = data[period].expenses.toFixed(2);
                    }
                    next();
                });
            }],
            
            // Step 3
            'currentPeriod': [
            function(next) {
                LNSSRen.currentTransactions({ nssrenID: nssren.nssren_id })
                .fail(function(err) { next(err); })
                .done(function(data) {
                    if (data) {
                        var creditTotal = 0;
                        var debitTotal = 0;
                        for (var type in data) {
                            for (var i=0; i<data[type].length; i++) {
                                creditTotal += data[type][i].credit;
                                debitTotal += data[type][i].debit;
                            }
                        }
                        results[0] = {
                            id: '9999-current',
                            date: new Date(),
                            beginningBalance: nssren.nssren_ytdBalance,
                            income: creditTotal,
                            expenses: debitTotal,
                            close: false
                        };
                        next();
                    } else {
                        next(new Error('Staff data not found'));
                    }
                });
            }],
            
            // Step 4
            'compileResults': ['history', 'balances', 'currentPeriod',
            function(next) {
                // Reassemble the indexed resultsByPeriod object into an array
                var i = 1;
                for (var period in resultsByPeriod) {
                    results[i] = resultsByPeriod[period];
                    results[i].closed = true;
                    results[i].id = period;
                    i++;
                }
                next();
            }],
            
            // Step 5
            'sort': ['compileResults', 
            function(next) {
                results.sort(function(a, b) {
                    // Descending order by `id`, which is the fiscal period
                    return b.id - a.id;
                });
                next();
            }]
        
        }, function(err) {
            if (err) {
                res.AD.error(err);
            } else {
                res.AD.success(results);
            }
        });
    }
};


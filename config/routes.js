/**
 * Routes
 *
 * Use this file to add any module specific routes to the main Sails
 * route object.
 */


module.exports = {


  /*

  '/': {
    view: 'user/signup'
  },
  '/': 'opstool-account-stewardwise/PluginController.inbox',
  '/': {
    controller: 'opstool-account-stewardwise/PluginController',
    action: 'inbox'
  },
  'post /signup': 'opstool-account-stewardwise/PluginController.signup',
  'get /*(^.*)' : 'opstool-account-stewardwise/PluginController.profile'

  */
    
    'get /opstool-account-stewardwise/account' : 'opstool-account-stewardwise/AccountController.transactions'


};


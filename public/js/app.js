angular
  .module('user-app', ['ngResource', 'angular-jwt', 'ui.router', 'ngFileUpload'])
  .constant('API', 'http://localhost:3000/api')
  .constant('S3', 'https://s3-eu-west-1.amazonaws.com/wdi-london18/')
  .config(InterceptorConfig)
  .config(Router)
  

InterceptorConfig.$inject = ['$httpProvider'];

function InterceptorConfig($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
  }


Router.$inject = ['$stateProvider', '$urlRouterProvider'];
function Router($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('home', {
      url: '/', 
      templateUrl: 'partials/home.ejs'
    })
    .state('login', {
      url: '/login', 
      templateUrl: 'partials/login.ejs'
    })
    .state('register', {
      url: '/register', 
      templateUrl: 'partials/register.ejs'
    })
    .state('profile', {
      url: '/profile', 
      templateUrl: 'partials/profile.ejs'
    })

    $urlRouterProvider.otherwise('/')
}      


angular
  .module('user-app')
  .factory('User', User);

User.$inject = ['$resource', 'API', 'S3'];
function User($resource, API, S3) {
  var user =  $resource(API + '/users/:id', { id: '@_id' }, {
    update: { method: "PUT" }, 
    connect: { method: "PATCH"},
    login: { method: "POST", url: API + '/login'},
    register: { method: "POST", url: API + '/register'}
  });

  Object.defineProperty(user.prototype, 'imageSRC', {get: function(){
    if(this.avatar) {
      return S3 + this.avatar;
    }
  }})
  
  return user;
}
angular.module('user-app')
  .factory('AuthInterceptor', AuthInterceptor);


AuthInterceptor.$inject = ['API', 'tokenService', 'roleService'];


function AuthInterceptor(API, tokenService, roleService) {
  return {
    request: function(config) {
      var token = tokenService.getToken();

      if(!!config.url.match(API) && !!token) {
        config.headers.Authorization = 'Bearer ' + token;
      }
      return config;
    },
    response: function(res) {
      if (!!res.config.url.match(API) && !!res.data.token) {
        tokenService.saveToken(res.data.token);
        roleService.saveRole(res.data.user.role)
      }
      return res;
    }
  }
} 
angular.module('user-app')
  .service('roleService', roleService);

roleService.$inject = ['$window', 'jwtHelper'];
function roleService($window, jwtHelper) {
  var self = this;


  self.saveRole = function(role) {
    $window.localStorage.setItem('role', role);

  }

  self.getRole = function() {
    return $window.localStorage.getItem('role');
  }

  self.removeRole = function () {
    return $window.localStorage.removeItem('role');
  }

  // self.getUser = function () {
  //   var token = self.getToken();
  //   return token? jwtHelper.decodeToken(token) : null;
  // }
}  
angular.module('user-app')
  .service('tokenService', TokenService);

TokenService.$inject = ['$window', 'jwtHelper'];
function TokenService($window, jwtHelper) {
  var self = this;


  self.saveToken = function(token) {
    $window.localStorage.setItem('token', token);

  }

  self.getToken = function() {
    return $window.localStorage.getItem('token');
  }

  self.removeToken = function () {
    return $window.localStorage.removeItem('token');
  }

  self.getUser = function () {
    var token = self.getToken();
    return token? jwtHelper.decodeToken(token) : null;
  }
}  
angular
  .module('user-app')
  .controller('mainController', MainController)

MainController.$inject = ['User', 'tokenService', 'Upload', 'API', 'S3', 'roleService', '$state', '$http', '$scope']

function MainController(User, tokenService, Upload, API, S3, roleService, $state, $http, $scope) {
  var self = this;
  
  self.current = tokenService.getUser();

  

}  
angular
  .module('user-app')
  .controller('usersController', UsersController)

UsersController.$inject = ['User', 'tokenService', 'Upload', 'API', 'S3', 'roleService', '$state', '$http', '$scope']
function UsersController(User, tokenService, Upload, API, S3, roleService, $state, $http, $scope) {
  var self = this;

  self.all = [];
  self.currentUser = tokenService.getUser();
  self.currentRole = roleService.getRole();
  self.user = {};

  

  function handleLogin(res) {
    var token = res.token ? res.token : null;
    if(token) {
      console.log(res);
      self.getUsers();
      self.currentUser = tokenService.getUser();
      

    }
    self.getUser();
    console.log("on longin", self.user)
    $state.go('home')
    self.message = res.message;
  }

  self.login = function() {
    User.login(self.currentUser, handleLogin);
  }

  self.register = function() {
    Upload.upload({
      url: API + '/register',
      data: self.currentUser
    }).then(function(res) {
      handleLogin(res);
      $state.go('home')
    });
  }

  self.logout = function() {
    tokenService.removeToken();
    roleService.removeRole();
    self.all = [];
    self.currentUser = null
    self.message = "";
    $state.go('login')
  }

  
  self.getUsers = function() {
    self.all = User.query();
  }
  self.addConnection = function(id) {
    User.connect({id: self.currentUser._id}, {friends: id});
    self.getUsers();
    self.getUser();
  }

  self.deleteConnection = function(id) {
    $http
      .patch(API +'/users/' + self.currentUser._id + '/disconnect', {friends: id})
      .then(function(res) {
      self.getUser();
      self.getUser();
    })

      var index = self.user.friends.indexOf(id);
      self.user.friends.splice(index, 1);
  }

  self.getUser = function() {
    self.userData = User.get({id: self.currentUser._id});
    console.log(self.user);
    self.userData.$promise.then(function(data) {
      $scope.$applyAsync(function(){
           self.user = data;
          console.log(data);
            });
    });
    console.log(self.user, "whey?")
  }
  
  


  self.isLoggedIn = function() {
    return !!tokenService.getToken();
  }
  
  
  if(self.isLoggedIn()) self.getUsers();

  return self;
}
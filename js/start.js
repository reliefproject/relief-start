(function() {


  const app = angular.module(
    'Start',
    ['ngSanitize']
  );


  app.controller('MainCtrl', function($scope, $timeout) {


    $scope.strings = {};
    $scope.languages = Relief.env.languages;
    $scope.selectedTab = 'login';
    $scope.forms = {};
    $scope.createAccountSuccess = false;
    $scope.login = {
      language: '',
      username: '',
      password: '',
    };
    $scope.create = {
      language: '',
      username: '',
      password1: '',
      password2: '',
    };
    let appData = {
      users: {},
    };


    Relief.db.app.getDoc().then(function(data) {
      if (data) {
        appData = data;
      }
      // Show "create account" if there are no users
      if (Object.keys(appData.users).length === 0) {
        $scope.selectedTab = 'create';
      }
      $scope.login.language = appData.language
        ? appData.language
        : Relief.env.defaultLanguage;
      $scope.create.language = $scope.login.language;
      // Let the main window show
      Relief.emit('loadingComplete');
    },
      // Error handler
      Relief.log.error
    );


    const languageChanged = function(language) {
      if (!language) {
        return;
      }
      appData.language = language;
      Relief.db.app.upsert(appData)
      .then(function() {
        return Relief.i18n.loadStrings(language, 'start');
      })
      .then(function(strings) {
        $scope.login.language = language;
        $scope.create.language = language;
        $scope.strings = strings;
        $scope.$apply();
        Relief.emit('languageChanged', language);
      },
        // Error handler
        Relief.log.error
      );
    };
    $scope.$watch('login.language', languageChanged);
    $scope.$watch('create.language', languageChanged);


    $scope.submitLoginForm = function() {
      if (!$scope.forms.loginForm.$valid) {
        $scope.forms.loginForm.err = $scope.strings.LOGIN_ERROR_FAILED;
        return;
      }
      // Client-side validation passed
      Relief.user.login(
        $scope.login.username,
        $scope.login.password
      ).then(function() {
        Relief.emit('loggedIn');
        Relief.emit('notify', {
          type: 'default',
          message: $scope.strings.WELCOME + ' ' + $scope.login.username
        });
      }, function(err) {
        $scope.forms.loginForm.$invalid = true;
        $scope.forms.loginForm.err = $scope.strings.LOGIN_ERROR_FAILED;
        $scope.$apply();
        Relief.log.error(err);
      });
    };


    $scope.submitCreateForm = function() {
      if ($scope.create.password1 !== $scope.create.password2) {
        $scope.forms.createForm.err = $scope.strings.CREATE_ERROR_MATCH;
        return;
      }
      if (!$scope.forms.createForm.username.$valid) {
        $scope.forms.createForm.err = $scope.strings.CREATE_ERROR_USERNAME;
      }
      if (!$scope.forms.createForm.password1.$valid) {
        $scope.forms.createForm.err = $scope.strings.CREATE_ERROR_PASSWORD;
      }
      // Client-side validation passed
      if ($scope.forms.createForm.$valid) {
        $scope.forms.createForm.password2.$setUntouched();
        Relief.user.createAccount({
          username: $scope.create.username,
          password: $scope.create.password1,
        })
        .then(function() {
          $scope.selectedTab = 'login';
          $scope.createAccountSuccess = true;
          $scope.$apply();
        }, function(err) {
          $scope.forms.createForm.$invalid = true;
          $scope.forms.createForm.err = $scope.strings.CREATE_ERROR_NAMETAKEN;
          $scope.$apply();
          Relief.log.error(err);
        });
      }
    };

  });

})();

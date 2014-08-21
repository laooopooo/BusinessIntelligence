var managementControllers = angular.module('management.controllers', [
    'management.services'
]);

managementControllers.controller('ManagementCtrl', ['$scope',
    function ($scope) {
    }]);

managementControllers.controller('UsersCtrl', ['$scope', 'UsersFactory',
    function ($scope, UsersFactory) {
        UsersFactory.query().$promise.then(function (users) {
            $scope.users = Enumerable.from(users).orderByDescending(function (user) {
                return user.metrics.current_login_date;
            }).toArray();
        });
    }]);

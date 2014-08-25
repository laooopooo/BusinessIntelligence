var searchControllers = angular.module('search.controllers', [
    'search.services'
]);

searchControllers.controller('SearchCtrl', ['$scope', 'TaskSearchFactory', '$sce',
    function ($scope, TaskSearchFactory, $sce) {
            $scope.search = {
                criteria: '',
                tasks: []
        };
    
        $scope.highlight = function (text) {
            var criteria = $scope.getCriteria();

            if (!$scope.getCriteria()) {
                return $sce.trustAsHtml(text);
            }

            return $sce.trustAsHtml(text.replace(new RegExp(criteria, 'gi'), '<span class="ui-match">$&</span>'));
        };

        $scope.search = function() {
            var criteria = $scope.getCriteria();
            if (criteria.length >= 3) {
                $scope.searching = 1;
                TaskSearchFactory.query({
                    criteria: criteria
                }, function(tasks) {
                    $scope.search.tasks = tasks;
                    $scope.searching = 0;
                });
            } else {
                $scope.search.tasks = [];
            }
        };

        $scope.getCriteria = function() {
            return $scope.search.criteria.replace('(', '').replace(')', '');
        };
    }]);
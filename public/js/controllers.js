var controllers = angular.module('controllers', ['search.services']);

controllers.controller('TaskCtrl', ['$scope', 'TaskFactory',
    function ($scope, TaskFactory) {
        $scope.tasks = TaskFactory.query();
    }]);

controllers.controller('ApplicationCtrl', ['$scope', 'Application',
    ///<summary>Main application controller</summary>
    function ($scope, Application) {
        Application.then(function(user) {
            $scope.user = user;

            $scope.$on('user.updated', function(event, user) {
                $scope.user = user;
            });
        });

        $scope.trimText = function(text, length) {
            text = text || '';
            if (text.length > length) {
                return sprintf('%s..', text.substring(0, length));
            }

            return text;
        };

        $scope.alphaOrder = function(collection, item) {
            return String.fromCharCode(65 + collection.indexOf(item));
        };
    }]);

controllers.controller('NavbarCtrl', ['$scope', '$window', 'Application', 'MetricsFactory',
    ///<summary>Navigation controller</summary>
    function ($scope, $window, Application, MetricsFactory) {
        Application.then(function(user) {
            $scope.navigation = {
                groups: []
            };

            if (user.access.taskCreate) {
                $scope.navigation.groups.push({
                    id: 'nav-newtask',
                    name: 'NEW TASK',
                    type: 'button',
                    icon: 'glyphicon glyphicon-plus',
                    path: '/task/create'
                });
            }

            $scope.navigation.groups.push({
                id: 'nav-alltasks',
                name: 'ALL TASKS',
                icon: 'glyphicon glyphicon-list',
                type: 'button',
                path: '/task/all'
            });

            $scope.navigation.groups.push({
                id: 'nav-modifiedtasks',
                name: 'RECENTLY MODIFIED',
                icon: 'glyphicon glyphicon-flag',
                type: 'button',
                path: '/task/modified'
            });

            if (user.access.manageUsers) {
                $scope.navigation.groups.push({
                    id: 'nav-management',
                    name: 'MANAGEMENT',
                    icon: 'glyphicon glyphicon-cog',
                    type: 'dropdown',
                    path: '/management',
                    items: [{
                        id: 'nav-management-users',
                        name: 'USERS',
                        path: '/management/users',
                        icon: 'glyphicon glyphicon-user'
                    }]
                });
            }

            if (user.id) {
                MetricsFactory.tasks.get({}, function(metrics) {
                    if (metrics.newly_added_tasks_count) {
                        allTasks.badge = {
                            text: metrics.newly_added_tasks_count
                        };
                    }
                });
            }
        
            setTimeout(function () {
                $('li.dropdown').click(function () {
                    $(this).removeClass('open');
                });
            }, 3);
        });

        $scope.signin = function() {
            
        };

        $scope.signup = function() {
            
        };

        $scope.signout = function() {
        };

        $scope.isActive = function (viewLocation) {
            return $window.location.pathname.indexOf(viewLocation) > -1;
        };
    }]);

controllers.controller('ProfileCtrl', ['$scope', 'ProfileFactory',
    ///<summary>User profile controller [Depends on ApplicationCtrl]</summary>
    function ($scope, ProfileFactory) {
        $scope.submit = function() {
            ///<summary>Submits user profile</summary>
            
            $scope.saving = 1;

            ProfileFactory.save($scope.user, function(user) {
                $scope.$emit('user.updated', user);

                $scope.saving = 0;
            });
        };

        $scope.validate = function () {
            return ($scope.user.new_password === $scope.user.confirm_password) &&
                $scope.user.first_name &&
                $scope.user.last_name;
        };
    }]);
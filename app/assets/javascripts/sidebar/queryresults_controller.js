'use strict';

var queryResultsApp = angular.module('queryResultsApp',[]);
queryResultsApp.controller('QueryResultsCtrl', ['$scope', '$element', '$attrs', 'sharedService', function($scope, $element, $attrs, sharedService) {
    $scope.results = [];

    $scope.$on('handleBroadcast', function(evt,msg,obj) {
        switch(msg) {
            //notification from the ol_map_controller
            case 'features-added':
            case 'features-marked':
                $scope.results = obj;
                $scope.$apply();
                break;
        }
    });
}]).directive('addSlimScroll', ['$timeout',function($timeout) {
    return function(scope,element,attrs) {
        $timeout(function() {
            element.slimScroll({
                color: '#ff0000',
                size: '15px',
                height: '300px'
            });
        });
    }
}]);
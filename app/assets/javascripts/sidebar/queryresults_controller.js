'use strict';

var queryResultsApp = angular.module('queryResultsApp',[]);
queryResultsApp.controller('QueryResultsCtrl', ['$scope', '$element', '$attrs', 'sharedService', function($scope, $element, $attrs, sharedService) {
    $scope.results = [];

    $scope.$on('handleBroadcast', function(evt,msg,obj) {
        switch(msg) {
            //notification from the ol_map_controller
            case 'features-marked':
                $scope.results = obj;
                break;
        }
    });
}]);
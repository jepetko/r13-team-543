angular.element(document).ready(function() {
    OpenLayers.ImgPath = "/assets/";
    angular.bootstrap($('#map-app'),            ['mapApp', 'globalBroadcastServices']);
    angular.bootstrap($('#queryresults-app'),   ['queryResultsApp', 'globalBroadcastServices']);
    angular.bootstrap($('#locationfinders-app'),['locationFindersApp', 'globalBroadcastServices'] );
});
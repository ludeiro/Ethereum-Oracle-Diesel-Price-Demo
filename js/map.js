
$(document).ready(function () {
    mapboxgl.accessToken = 'pk.eyJ1IjoibHVkZWlybyIsImEiOiJjanQ1bDA5aWQwMTFsNGFuemczb20ybmNxIn0.4ykvt45lgMJUP2KYMhhoBA';
    var map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/mapbox/streets-v9', // stylesheet location
        center: [-5.6632, 40.9647], // starting position [lng, lat]
        zoom: 13 // starting zoom
    });

    map.on('mousemove', function (e) {
        //$("#latitud").val(e.lngLat.lat);
        //$("#longitud").val(e.lngLat.lng);
        $("#zoom").val(map.getZoom());
    });

    var marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat([-5.6632, 40.9647])
        .addTo(map);

    function onDragEnd() {
        var lngLat = marker.getLngLat();
        $("#latitud").val(lngLat.lat);
        $("#longitud").val(lngLat.lng);
    }

    marker.on('dragend', onDragEnd);
    $("#latitud").val(40.9647);
    $("#longitud").val(-5.6632);
    $("#zoom").val(map.getZoom());
})

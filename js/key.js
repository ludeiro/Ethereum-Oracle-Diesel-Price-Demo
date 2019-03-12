var MinLatitude = -85.05112878,
    MaxLatitude = 85.05112878,
    MinLongitude = -180,
    MaxLongitude = 180;

    
//Params (latitud, longitud, zoom)
function latlng2quadkey(a, c, b) {
    a = latlng2xy(a, c, b);
    a = xy2txty(a[0], a[1]);
    return txty2quadkey(a[0], a[1], b)
}

function txty2quadkey(a, c, b) {
    var d = "";
    for (i = b; 0 < i; i--) {
        b = 0;
        var e = 1 << i - 1;
        0 != (a & e) && b++;
        0 != (c & e) && (b++, b++);
        d = d + "" + b
    }
    return d
}

function xy2txty(a, c) {
    var b = Array(2);
    b[0] = Math.floor(a / 256);
    b[1] = Math.floor(c / 256);
    return b
}

function latlng2xy(a, c, b) {
    a = Clip(a, MinLatitude, MaxLatitude);
    c = Clip(c, MinLongitude, MaxLongitude);
    c = (c + 180) / 360;
    a = Math.sin(a * Math.PI / 180);
    a = 0.5 - Math.log((1 + a) / (1 - a)) / (4 * Math.PI);
    b = MapSize(b);
    var d = Array(2);
    d[0] = Math.floor(Clip(c * b + 0.5, 0, b - 1));
    d[1] = Math.floor(Clip(a * b + 0.5, 0, b - 1));
    return d
}

function MapSize(a) {
    return 256 << a
}

function Clip(a, c, b) {
    return Math.min(Math.max(a, c), b)
};
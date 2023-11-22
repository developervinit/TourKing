//this file is for getting maps 

export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmluaXQ3MSIsImEiOiJja2c3d2xjOWswYm1mMnhudnlyNjlrdGduIn0.p_As-TMNT3iYA2EVRPdYiQ';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/vinit71/ckg7xego92x1h19que1773i99',
        scrollZoom: false
        //center: [-118.113491, 34.111745], //first longitute then latitute
        //zoom: 8,
        //interactive: false
    });
    
    //This bounds object here is basically the area that will be displayed on the map.
    const bounds = new mapboxgl.LngLatBounds();
    
    locations.forEach(loc => {
        //create marker
        const el = document.createElement('div');
        el.className = 'marker';
    
        //add marker 
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        })
        .setLngLat(loc.coordinates)
        .addTo(map);
    
        //adding popup. it show the location name on map 
        new mapboxgl.Popup({
            offset: 30
        })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description} </p>`)
        .addTo(map);
    
        //extend map bounds to include current location 
        bounds.extend(loc.coordinates);
    });
    
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}


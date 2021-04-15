/* eslint - disable */
import '@babel/polyfill';

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoidGF1cnVzaWx2ZXIiLCJhIjoiY2tteXM4azFjMDZ6YzJ3bWJzd2p1bmp2aiJ9.Avr8PyhNxeTS4TymUxYODg';

  var map = new mapboxgl.Map({
    // The map is placed in a container with id-map
    container: 'map',
    style: 'mapbox://styles/taurusilver/ckmyztomp2ayd17o834nb4ipr',
    scrollZoom: false,
    //   center: [-118.113491, 34.111745],
    //   zoom: 10,
    //   interactive: false,
  });

  // to automatically position out the map based on the tour location points.
  // place all the locations of a tour on a map & allow it to configure the cordinates to display all the locations on the map correctly.
  const bounds = new mapboxgl.LngLatBounds();

  // extend the bound with all locations
  locations.forEach((loc) => {
    // create marker
    const ele = document.createElement('div');
    ele.className = 'marker';

    //   Add marker
    new mapboxgl.Marker({
      element: ele,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // extend map bound to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};

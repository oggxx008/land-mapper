# Issues #

A list of issues that will be brought to Google team for discussion

**Database**

With newly produced model/data, the database need to be updated. It should be more compact and more efficient, be able to handle both global and regional data. It would be prefect if JSON and image tiles can also be stored.

**Query**

Inconsistent results: sometimes incomplete, sometimes no results.

A distance-based or distance-optimized query would be very helpful and useful. The number of query results should be optimized based on the context of the map.

**Mapping Objects**

Errors like "f is full" halt the webpages in some cases. It is more severe when viewing the local data (cells).

The number of Google maps/visualization objects is too big. Maybe, a pool should be used to restrict their quantity. And a better dispose/recycle mechanism is needed.

**Synchronization and optimization**

Zoom in would not load data.

The rectangle-overlap based query optimization is often negatively influenced by asynchronized requests.

**Efficiency**

Speed up front-end calculation of a large number of scenarios.


**Smoother animation**

Avoid clunky or blinking animations using Google maps overlays and Google charts.

**Integration with other JS libraries**

Carousal library, d3.js (particularly animation), menus with multiple check boxes

**Small Issues**

Ground Overlay problem with Russia (-180 to 180).
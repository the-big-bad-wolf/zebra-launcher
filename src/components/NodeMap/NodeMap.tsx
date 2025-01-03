import "maplibre-gl/dist/maplibre-gl.css";
import "./popup.css";
import { useMapEffect } from "solid-maplibre";
import { Popup } from "maplibre-gl";
import { createEffect, createSignal } from "solid-js";

const requestURL = "http://ip-api.com/batch";

interface ZcashNode {
  lat: number;
  lon: number;
  country: string;
  regionName: string;
  city: string;
  query: string;
  status: string;
}
interface NodeMapProps {
  ipAddresses: string[];
}
const NodeMap = (props: NodeMapProps) => {
  const [zcashNodes, setZcashNodes] = createSignal<ZcashNode[]>([]);
  const [userLocation, setUserLocation] = createSignal<GeolocationPosition | null>(null);
  createEffect(() => {
    fetch(requestURL, {
      method: "POST",
      body: JSON.stringify(props.ipAddresses),
    })
      .then(response => response.json())
      .then(data => {
        const groupedNodes = data.reduce((acc: { [key: string]: ZcashNode[] }, node: ZcashNode) => {
          const key = `${node.lat},${node.lon}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(node);
          return acc;
        }, {});

        const spreadNodes = (Object.values(groupedNodes) as ZcashNode[][]).flatMap(
          (nodes, index) => {
            if (nodes.length === 1) return nodes;

            const angleStep = (2 * Math.PI) / nodes.length;
            const baseRadius = 0.00001 * Math.sqrt(nodes.length); // Dynamic radius based on node count
            return nodes.map((node, i) => {
              const angle = i * angleStep;
              const latOffset = baseRadius * Math.cos(angle);
              const lonOffset =
                (baseRadius * Math.sin(angle)) / Math.cos(((node.lat + latOffset) * Math.PI) / 180);
              return {
                ...node,
                lat: node.lat + latOffset,
                lon: node.lon + lonOffset,
              };
            });
          }
        );

        setZcashNodes(spreadNodes);
      });
  });

  navigator.geolocation.getCurrentPosition(position => {
    setUserLocation(position);
  });

  useMapEffect(mapRef => {
    if (mapRef.hasImage("node-dot")) {
      mapRef.removeImage("node-dot");
      mapRef.removeLayer("node-layer");
      mapRef.removeLayer("clusters");
      mapRef.removeLayer("cluster-count");
      mapRef.removeSource("node-locations");
    }

    const size = 50;
    const nodeDot = new pulsingDot(size, "rgba(207, 138, 0, 1)", mapRef);
    mapRef.addImage("node-dot", nodeDot, { pixelRatio: 2 });
    mapRef.addSource("node-locations", {
      type: "geojson",
      cluster: true,
      clusterRadius: 25,
      clusterMaxZoom: 14,
      data: {
        type: "FeatureCollection",
        features: zcashNodes().map((node, index) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [node.lon, node.lat],
          },
          properties: {
            id: index,
          },
        })),
      },
    });
    mapRef.addLayer({
      id: "node-layer",
      type: "symbol",
      source: "node-locations",
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": "node-dot",
        "icon-allow-overlap": true,
      },
    });
    mapRef.addLayer({
      id: "clusters",
      type: "circle",
      source: "node-locations",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": ["step", ["get", "point_count"], "#CF8A00", 6, "#dc6900", 16, "#ff0000"],
        "circle-radius": ["step", ["get", "point_count"], 10, 5, 11, 15, 12],
      },
    });

    mapRef.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "node-locations",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-size": 12,
        "text-allow-overlap": true,
      },
    });

    mapRef.on("mouseenter", "node-layer", () => {
      mapRef.getCanvas().style.cursor = "pointer";
    });
    mapRef.on("mouseleave", "node-layer", () => {
      mapRef.getCanvas().style.cursor = "";
    });

    mapRef.on("click", "node-layer", e => {
      const coordinates = (e.features![0].geometry as GeoJSON.Point).coordinates.slice();
      const description = `<div style="color: #F5A800; background-color: black; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 20px; border-radius: 5px;">
      <b>IP Address:</b> ${zcashNodes()[e.features![0].properties.id].query}<br>
      <b>Country:</b> ${zcashNodes()[e.features![0].properties.id].country}<br>
      <b>Region:</b> ${zcashNodes()[e.features![0].properties.id].regionName}<br>
      <b>City:</b> ${zcashNodes()[e.features![0].properties.id].city}
      </div>`;
      new Popup({ closeOnClick: true, className: "maplibre-popup" })
        .setLngLat(coordinates as [number, number])
        .setHTML(description)
        .addTo(mapRef);
    });

    mapRef.on("mouseenter", "clusters", () => {
      mapRef.getCanvas().style.cursor = "pointer";
    });
    mapRef.on("mouseleave", "clusters", () => {
      mapRef.getCanvas().style.cursor = "";
    });

    mapRef.on("click", "clusters", e => {
      const features = mapRef.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      const clusterId = features[0].properties!.cluster_id;
      (mapRef.getSource("node-locations") as maplibregl.GeoJSONSource)
        .getClusterLeaves(clusterId, 1000, 0)
        .then((leaves: any) => {
          const coordinates = leaves.map((leaf: any) => leaf.geometry.coordinates);
          const description = `<div style="color: #F5A800; background-color: black; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 20px; border-radius: 5px;">
            <b>Cluster Size:</b> ${features[0].properties!.point_count}<br>
            <b>IP Addresses:</b><br>${leaves
              .slice(0, 10)
              .map((leaf: any) => zcashNodes()[leaf.properties.id].query)
              .join("<br>")}${leaves.length > 10 ? "<br>..." : ""}
            </div>`;
          new Popup({ closeOnClick: true, className: "maplibre-popup" })
            .setLngLat(coordinates[0] as [number, number])
            .setHTML(description)
            .addTo(mapRef);
        });
    });
  });

  useMapEffect(mapRef => {
    if (userLocation()) {
      if (mapRef.hasImage("user-dot")) {
        mapRef.removeImage("user-dot");
        mapRef.removeLayer("user-layer");
        mapRef.removeSource("user-location");
      }
      const size = 50;
      const userDot = new pulsingDot(size, "rgba(0, 0, 255, 1)", mapRef);
      mapRef.addImage("user-dot", userDot, { pixelRatio: 2 });
      mapRef.addSource("user-location", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [userLocation()!.coords.longitude, userLocation()!.coords.latitude],
              },
              properties: null,
            },
          ],
        },
      });
      mapRef.addLayer({
        id: "user-layer",
        type: "symbol",
        source: "user-location",
        layout: {
          "icon-image": "user-dot",
        },
      });
    }
  });

  return <></>;
};

export default NodeMap;

class pulsingDot {
  width: number;
  height: number;
  color: string;
  data: Uint8Array;
  context: CanvasRenderingContext2D | null;
  mapRef: maplibregl.Map;

  constructor(size: number, color: string, mapRef: maplibregl.Map) {
    this.width = size;
    this.height = size;
    this.color = color;
    this.data = new Uint8Array(this.width * this.height * 4);
    this.context = null;
    this.mapRef = mapRef;
  }

  onAdd() {
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    this.context = canvas.getContext("2d", { willReadFrequently: true });
  }

  render() {
    const duration = 1500;
    const t = (performance.now() % duration) / duration;

    const radius = (this.width / 2) * 0.3;
    const outerRadius = (this.width / 2) * 0.7 * t + radius;
    const context = this.context;

    if (!context) return;

    context.clearRect(0, 0, this.width, this.height);
    context.beginPath();
    context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
    context.fillStyle = this.color.replace("1)", `${1 - t})`);
    context.fill();

    context.beginPath();
    context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
    context.fillStyle = this.color;
    context.strokeStyle = "white";
    context.lineWidth = 2 + (1 - t);
    context.fill();
    context.stroke();

    this.data = new Uint8Array(
      context.getImageData(0, 0, this.width, this.height).data.buffer as ArrayBuffer
    );

    this.mapRef.triggerRepaint();

    return true;
  }
}

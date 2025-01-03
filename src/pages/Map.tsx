import { Map } from "solid-maplibre";
import NodeMap from "../components/NodeMap/NodeMap";
import { NAVIGATION_BAR_HEIGHT } from "../constants";
import { createSignal, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { parse } from "toml";

const MapContainer = () => {
  const is_tauri_app = window.hasOwnProperty("__TAURI_INTERNALS__");
  const [nodeIPs, setNodeIPs] = createSignal<string[]>([]);
  onMount(async () => {
    if (is_tauri_app) {
      const configStr = await invoke<string>("read_config");
      try {
        const config = parse(configStr);
        const listenAddr = config.rpc.listen_addr;
        const cookiePath = config.rpc.cookie_dir;
        console.log("listenAddr:", listenAddr);
        console.log("cookiePath:", cookiePath);
        const body = {
          method: "getpeerinfo",
          id: "jPV8ufjDdt",
          params: [],
        };
        fetch(`http://${listenAddr}/getpeerinfo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session=${cookiePath}`,
          },
          body: JSON.stringify(body),
        })
          .then(response => response.json())
          .then(data => {
            setNodeIPs(data.result.map((peer: any) => peer.addr.split(":")[0]));
          });
      } catch (error) {
        console.error("Failed to parse TOML:", error);
      }
    } else {
      setNodeIPs(["1.1.1.1"]);
    }
  });
  return (
    <div
      class={`flex flex-col justify-center items-center`}
      style={`height: calc(100vh - ${NAVIGATION_BAR_HEIGHT})`}
    >
      <Map
        class="rounded-t-lg w-full h-full"
        options={{
          style: "./src/components/NodeMap/map.json",
          zoom: 1,
          maxZoom: 18,
          minZoom: 1,
          center: [0, 30],
          attributionControl: false,
          crossSourceCollisions: false,
        }}
      >
        <NodeMap ipAddresses={nodeIPs()} />
      </Map>
    </div>
  );
};

export default MapContainer;

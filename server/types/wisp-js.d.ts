declare module "@mercuryworkshop/wisp-js/server" {
  export const server: {
    options: {
      allow_udp_streams?: boolean;
      hostname_blacklist?: RegExp[];
      dns_servers?: string[];
    };
    routeRequest: (req: any, socket: any, head: any) => void;
  };
  export const logging: {
    NONE: number;
    ERROR: number;
    WARN: number;
    INFO: number;
    DEBUG: number;
    set_level: (level: number) => void;
  };
}

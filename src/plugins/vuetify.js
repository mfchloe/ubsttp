import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "@mdi/font/css/materialdesignicons.css";

import "vuetify/styles";
import "@fortawesome/fontawesome-free/css/all.css";

const myCustomTheme = {
  dark: false,
  colors: {
    primary: "#272D4E",
    secondary1: "#F08BB5",
    secondary2: "#B8D6F7",
    lightGray: "#F7F8F4",
    darkGray: "#E6E7E4",

    icon: "#23538F",
    accent: "#FF4081",
    error: "#272D4E",
    success: "#4CAF50",
    warning: "#FFA000",
    info: "#1976D2",
  },
};

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "customTheme",
    themes: {
      customTheme: myCustomTheme,
    },
  },
  icons: {
    iconfont: "mdi", // Default icon font (Material Design Icons)
    values: {
      fa: "fa", // Font Awesome prefix (use 'fa' for Font Awesome icons)
      mdi: "mdi", // Material Design Icons prefix
    },
  },
});

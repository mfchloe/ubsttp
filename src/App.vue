<template>
  <NavBar v-if="showNavBar" />
  <router-view />
</template>

<script>
import NavBar from "./components/NavBar.vue";
import { auth, firestore } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { provide, reactive, onMounted } from "vue";

export default {
  name: "App",
  components: {
    NavBar,
  },
  computed: {
    showNavBar() {
      const hiddenRoutes = ["SignIn", "SignUp", "NotFound"];
      return !hiddenRoutes.includes(this.$route.name);
    },
  },
  setup() {
    const user = reactive({
      user: null,
    });

    // Listener for user authentication state
    const setupAuthListener = async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userData = await getDoc(userDocRef);
        if (userData.exists()) {
          user.user = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...userData.data(),
          };
        } else {
          console.error("No user data found for this user.");
        }
      } else {
        user.user = null;
      }
    };

    // Call the auth listener when the component is mounted
    onMounted(() => {
      onAuthStateChanged(auth, setupAuthListener);
    });

    provide("user", user);

    return { user };
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
